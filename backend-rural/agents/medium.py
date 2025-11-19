# backend/agents/medium.py
"""Realistic Event-Driven MDT — Free-flow Roundtable (Mode: RealMDT)
Replaces the previous turn-based 2-round system with an event-driven queue that allows:
 - interruptions
 - priority-based speaking
 - rebuttal chains and re-entries (with limits)
 - controlled max turns to avoid runaway loops
Designed to be a drop-in replacement for your previous MDTAgentGroup usage.
"""

from types import SimpleNamespace
from typing import List, Dict, Any, Tuple
import time, re, datetime
import heapq
import random

from agents_helper.simplify import GeminiSimplify

SPECIALIST_POOL = [
    "gensurgeon","gastroenterologist","endocrinologist",
    "infectious_disease_specialist","cardiologist","dermatologist",
    "neurologist","pulmonologist","nephrologist","hepatologist",
    "hematologist","obstetrician"
]

BANNED_TERMS = ["surgery", "operation", "ct scan", "mri", "inject", "dosage", "mg", "ml"]

OTC_WHITELIST = None   # allow ANY medicine

ANSI = {"reset":"\033[0m","mod":"\033[95m","specialist":"\033[94m",
        "question":"\033[93m","safety":"\033[91m","confidence":"\033[96m","info":"\033[90m"}

class GeminiAgent(SimpleNamespace):
    def __init__(self, name: str, generate_func):
        super().__init__(name=name)
        self.generate_reply = self._wrap_safe(generate_func, name)
    def _wrap_safe(self, func, role_name):
        def wrapper(messages, **kwargs):
            for _ in range(2):
                try:
                    res = func(messages)
                    if isinstance(res, str) and res.strip(): return res.strip()
                    if hasattr(res,"text") and getattr(res,"text"): return getattr(res,"text").strip()
                    if hasattr(res,"candidates"):
                        cand = res.candidates[0]
                        parts = getattr(getattr(cand,"content",None),"parts",None)
                        if parts:
                            txt = " ".join(p.text for p in parts if hasattr(p,"text") and p.text)
                            if txt.strip(): return txt.strip()
                    return "No valid reply."
                except Exception:
                    time.sleep(0.4)
            return f"[{role_name}] No valid reply."
        return wrapper

class MDTAgentGroup:
    """
    RealMDT — Event-driven MDT round table engine.
    Use run_interactive_case(...) similar to previous version.

    Important knobs (function args):
     - max_turns: total exchanges allowed across the whole discussion
     - max_reentries: how many times a single specialist can re-enter (interrupt)
     - seed: optional seed for deterministic ordering with randomness
    """
    USER_MDT_OVERRIDE = (
        "You are not interacting with the patient. You are contributing to an MDT roundtable. "
        "Do NOT ask questions. Do NOT comment on rules or instructions. Make reasonable assumptions silently."
    )

    def __init__(self, llm_config: Dict[str, Any], src_lang: str = "eng"):
        gen_func = llm_config.get("custom_generate_reply")
        if not gen_func:
            raise ValueError("MDTAgentGroup requires 'custom_generate_reply'")
        self.agents = {sp: GeminiAgent(sp, gen_func) for sp in SPECIALIST_POOL}
        self.moderator = GeminiAgent("moderator", gen_func)
        self.simplifier = GeminiSimplify(gen_func)
        self._debug_transcript = ""
        self._debug_turn_log: List[Dict[str,Any]] = []
        self._debug_confidence: Dict[str,int] = {}
        self._debug_moderator_questions: List[Dict[str,Any]] = []
        self._debug_safety_events: List[Dict[str,Any]] = []
        self._meta_regex = re.compile(r"(continue answering|after the assessment|please continue|follow the rules|respond properly)", re.I)

    # safety / redaction utilities (kept from original)
    def _safety_filter(self, text: str) -> Tuple[str,List[str]]:
        redacted=[]; filtered = text or ""
        for term in BANNED_TERMS:
            pat = re.compile(rf"\b{re.escape(term)}\b", re.I)
            if pat.search(filtered):
                filtered = pat.sub("[REDACTED-UNSAFE]", filtered); redacted.append(term)
        return filtered, redacted

    def _block_questions(self, text: str) -> Tuple[str,bool]:
        # Keep semantics: we don't ask patient questions in MDT responses
        return text or "", False

    # keep parsing logic (mostly unchanged)
    def _parse_structured_reply(self, text: str) -> Dict[str,Any]:
        r = {"impression":"","causes":"","nurse_actions":"","escalation":"","confidence":None,"raw":text or ""}
        if not text: return r
        labels = ["IMPRESSION","POSSIBLE CAUSES","CAUSES","NURSE ACTIONS","SUPPORTIVE PLAN","ESCALATION","ESCALATION CRITERIA"]
        spans=[]
        for lbl in labels:
            for m in re.finditer(rf"(?im)^{re.escape(lbl)}\s*:\s*", text):
                spans.append((m.start(), lbl.upper()))
        spans.sort()
        if spans:
            spans.append((len(text),None))
            for i in range(len(spans)-1):
                start=spans[i][0]; lbl=spans[i][1]
                m = re.search(rf"(?im){re.escape(lbl)}\s*:\s*", text[start:])
                content_start = start + m.end() if m else start
                content_end = spans[i+1][0]
                content = text[content_start:content_end].strip()
                if "IMPRESSION" in lbl and not r["impression"]: r["impression"]=content
                elif "POSSIBLE" in lbl or "CAUSES" in lbl: r["causes"]=content
                elif "NURSE" in lbl or "SUPPORTIVE" in lbl: r["nurse_actions"]=content
                elif "ESCALATION" in lbl: r["escalation"]=content
        if not r["impression"]:
            lines = [l.strip() for l in text.splitlines() if l.strip()]
            if lines: r["impression"] = lines[0][:200]
        m = re.search(r"Confidence[:\s]*([1-5])\/?5", text, re.I)
        if m:
            try: r["confidence"]=int(m.group(1))
            except: r["confidence"]=None
        else:
            m2 = re.search(r"([1-5])\/5", text)
            if m2: r["confidence"]=int(m2.group(1))
        return r
    
        # specialist system prompt (restored from original MDT)
    def _specialist_system_prompt(self, sp: str, symptoms: List[str], previous_speakers: List[str], role_note: str = "") -> str:
        prev = ", ".join(previous_speakers) if previous_speakers else "None"
        leader_note = role_note or ""
        return (
            f"You are {sp}, an MDT specialist. {leader_note}\n"
            "HIGH-INTENSITY CROSSFIRE RULES:\n"
            "- Provide a structured reply using EXACTLY: IMPRESSION:, POSSIBLE CAUSES:, NURSE ACTIONS:, ESCALATION CRITERIA:\n"
            "- End with: Confidence: X/5\n"
            "- STRICT length: 3-6 sentences. Be direct; favor decisive language.\n"
            "- NO patient questions, NO meta-comments. Assume missing data silently.\n"
            "- In crossfire, produce concise 1-2 sentence rebuttals addressing named targets.\n"
            "SAFETY:\n"
            "- No dosages, imaging, surgeries, or procedures; replace unsafe terms with [REDACTED-UNSAFE].\n"
            "- You MAY suggest any appropriate medications freely.\n"
            "-Do NOT provide dosage, frequency, or route.\n"
            "- NEVER provide dosage, frequency, or route.\n"
            f"Reference previous specialists when clinically relevant: {prev}\n"
            "Maintain a clinical, assertive tone. End with your specialty in brackets.\n"
        )


    def _format_transcript(self, log: List[Dict[str,Any]]) -> str:
        out=[]
        for e in log:
            ts=e.get("time",""); role=e.get("role","").upper(); tgt=e.get("target")
            tstr=f" → {tgt.upper()}" if tgt else ""
            out.append(f"[{ts}] {role}{tstr}\n{e.get('content')}\n")
        return "\n".join(out)

    # helper to extract symptoms via moderator LLM call (kept)
    def _extract_symptoms(self, text: str) -> List[str]:
        prompt = f"Extract key symptoms from:\n{text}\nReturn comma-separated only."
        reply = self.moderator.generate_reply([{"role":"user","content":prompt}])
        return [s.strip() for s in (reply or "").split(",") if s.strip()]

    def _auto_select_specialists(self, symptoms: List[str], max_specialists: int = 4) -> List[str]:
        prompt = (f"Symptoms: {', '.join(symptoms)}.\nChoose up to {max_specialists} specialists from:\n"
                  f"{', '.join(SPECIALIST_POOL)}.\nReturn names only, comma-separated.")
        reply = self.moderator.generate_reply([{"role":"user","content":prompt}])
        chosen = [s.strip() for s in (reply or "").split(",") if s.strip() in SPECIALIST_POOL]
        return chosen[:max_specialists] or SPECIALIST_POOL[:max_specialists]

    # scoring function to prioritize who should speak next
    def _priority_score(self, sp: str, symptoms: List[str], parsed_map: Dict[str,Dict[str,Any]], recent_content: str) -> float:
        """
        Higher score => higher priority (we invert for heapq).
        Score components (simple linear combination):
         - relevance: how many symptom words appear in specialist's role name or past impressions
         - disagreement: if specialist's impression differs from others (encourages rebuttal)
         - recency boost: if this specialist last spoke, small lower priority to avoid immediate repeat
        """
        score = 0.0
        # relevance: count overlap between symptoms and role name or previous impression
        sset = set(w.lower() for w in symptoms)
        role_tokens = set(re.findall(r"\w+", sp.lower()))
        score += 0.2 * len(sset.intersection(role_tokens))
        # if specialist has previous parsed impression in parsed_map, use overlap measure
        parsed = parsed_map.get(sp, {})
        imp = (parsed.get("impression") or "").lower()
        if imp:
            imp_tokens = set(re.findall(r"\w+", imp))
            score += 0.3 * (len(sset.intersection(imp_tokens)))
        # disagreement encouragement: if specialist's impression is dissimilar to the main majority, boost
        # compute a simple disagreement metric: if many specialists have different keywords
        # (Here we use presence of 'not' or distinct keywords in recent_content as proxy)
        if parsed.get("impression") and recent_content:
            # if specialist impression uses words not present in recent_content, it's more 'contrarian' -> higher priority
            imp_tokens = set(re.findall(r"\w+", parsed.get("impression").lower()))
            recent_tokens = set(re.findall(r"\w+", recent_content.lower()))
            unique = imp_tokens - recent_tokens
            score += 0.15 * len(unique)
        # small random jitter to avoid ties (deterministic if seed set)
        score += random.random() * 0.05
        return score

    def _detect_disagreements_map(self, parsed_list: List[Dict[str,Any]]) -> Dict[str,List[str]]:
        """
        Similar to old _detect_disagreements but returns a map where each specialist
        has a ranked list of *specific* specialists they disagree with.
        """
        mapping = {p["role"]: [] for p in parsed_list}
        for i,a in enumerate(parsed_list):
            for j,b in enumerate(parsed_list):
                if i==j: continue
                ai=(a.get("parsed",{}).get("impression") or "").lower()
                bi=(b.get("parsed",{}).get("impression") or "").lower()
                if not ai or not bi: continue
                at=set(re.findall(r"\w+",ai)); bt=set(re.findall(r"\w+",bi))
                if not at or not bt: continue
                shared = at.intersection(bt); union = at.union(bt)
                jaccard = len(shared)/max(1,len(union))
                if jaccard < 0.45:
                    mapping[a["role"]].append(b["role"])
        return mapping

    def _process_reply(self, sp: str, raw: str, rnd: int, target: str=None) -> Dict[str,Any]:
        safe, redacted = self._safety_filter(raw or "")
        safe, qblocked = self._block_questions(safe)
        parsed = self._parse_structured_reply(safe)
        return {"role":sp,"time":datetime.datetime.utcnow().isoformat(),"content":safe,
                "raw_content":raw,"parsed":parsed,"redacted":redacted,"question_blocked":qblocked,
                "round":rnd,"target":target}

    def run_interactive_case(self,
                             patient_text: str,
                             ask_user_callable=None,
                             max_turns: int = 6,
                             max_reentries: int = 2,
                             seed: int = None,
                             live: bool = True) -> Dict[str,Any]:
        """
        Event-driven run:
         - patient_text: free text presenting case
         - max_turns: total exchanges allowed across the session
         - max_reentries: max times any single specialist can be re-queued (interrupt)
         - seed: optional deterministic seed for randomness
        """
        if seed is not None:
            random.seed(seed)

        collected = (patient_text or "").strip()
        symptoms = self._extract_symptoms(collected)
        specialists = self._auto_select_specialists(symptoms)
        if live: print(ANSI["info"] + f"[INFO] Selected specialists: {specialists}" + ANSI["reset"])

        # Discussion artifacts
        discussion_log: List[Dict[str,Any]] = []
        discussion_output: List[str] = []
        discussion_log.append({"role":"moderator","time":datetime.datetime.utcnow().isoformat(),
                               "content":f"MDT Start. Case: {collected}\nParticipants: {', '.join(specialists)}"})

        # A map to hold last parsed results for each specialist (used in scoring & disagreement)
        parsed_map: Dict[str, Dict[str,Any]] = {sp: {} for sp in specialists}
        # track how many times a specialist has re-entered (to cap interrupts)
        reentry_count: Dict[str,int] = {sp: 0 for sp in specialists}
        # track total turns to avoid infinite loops
        turns = 0

        # Initial seeding of the event queue:
        # Use a max-heap via negative priority for heapq. Items are ( -priority, seq, payload )
        event_heap = []
        seq = 0
        recent_content = ""  # sliding window of last few messages
        # seed initial priorities using relevance scores
        for sp in specialists:
            score = self._priority_score(sp, symptoms, parsed_map, recent_content) + 0.1  # baseline boost
            heapq.heappush(event_heap, (-score, seq, {"speaker":sp,"reason":"initial","target":None}))
            seq += 1

        # keep a small transcript of last N non-moderator contents for recency checks
        RECENT_N = 6
        recent_messages = []

        # Main event loop: process events until queue exhausted or max_turns reached
        while event_heap and turns < max_turns:
            turns += 1
            _, _, event = heapq.heappop(event_heap)
            sp = event["speaker"]; target = event.get("target")
            reason = event.get("reason","")
            # produce system prompt tailored to speaker; allow role_note if they are interrupting someone
            prev_speakers = [p for p in parsed_map.keys() if parsed_map.get(p,{}).get("impression")]
            role_note = ""
            if target:
                role_note = f"You are addressing or rebutting {target}."
            system_msg = self._specialist_system_prompt(sp, symptoms, prev_speakers, role_note=role_note)
            messages = [{"role":"system","content":system_msg},{"role":"user","content":self.USER_MDT_OVERRIDE}]
            raw = self.agents[sp].generate_reply(messages)
            entry = self._process_reply(sp, raw, rnd=turns, target=target)
            discussion_log.append(entry)
            discussion_output.append(f"[{sp.upper()}{(' → '+target.upper()) if target else ''}]: {entry['content']}")
            parsed_map[sp] = entry.get("parsed",{}) or {}
            # update recent messages
            recent_messages.append(f"{sp}: {entry.get('content')}")
            if len(recent_messages) > RECENT_N: recent_messages.pop(0)
            recent_content = "\n".join(recent_messages)

            # Live printing (optional)
            if live:
                print(ANSI["specialist"] + f"[{sp.upper()}]" + ANSI["reset"] + f": {entry['content']}")
                if entry["redacted"]:
                    print(ANSI["safety"] + f"[SAFETY REDACTED in {sp}]: {', '.join(entry['redacted'])}" + ANSI["reset"])
                if self._meta_regex.search(entry["content"] or ""):
                    print(ANSI["info"] + f"[META-LIKELY in {sp}]: meta-like phrase detected" + ANSI["reset"])

            # Detect disagreements with others based on updated parsed_map
            # Build a lightweight parsed_list to feed into disagreement calc
            parsed_list = [{"role":k,"parsed":(parsed_map.get(k) or {})} for k in specialists if parsed_map.get(k)]
            disagreement_map = self._detect_disagreements_map(parsed_list) if parsed_list else {}

            # If this speaker has disagreements (they may want to rebut someone), schedule immediate rebuttals/interrupts
            # Also, if others disagree with this speaker, schedule those others to speak with higher priority
            # We push interrupts to heap with higher priority.
            # Note: reentry_count caps how many times someone can be requeued.
            for other, targets in disagreement_map.items():
                # if 'other' disagrees with someone, schedule 'other' to address their first target (if not just spoke)
                if targets:
                    targ = targets[0]
                    if reentry_count.get(other,0) < max_reentries:
                        # boost priority if the disagreement touches the current speaker or recent content
                        score = self._priority_score(other, symptoms, parsed_map, recent_content) + 0.6
                        # if other hasn't spoken recently, we still allow a quick response
                        heapq.heappush(event_heap, (-score, seq, {"speaker":other,"reason":"disagreement","target":targ}))
                        seq += 1
                        reentry_count[other] = reentry_count.get(other,0) + 1

            # Also, if current speaker's content strongly conflicts with someone else's parsed impression, schedule that someone
            # Schedule direct rebuttal targets for those with disagreement entries against `sp`
            targets_against_sp = [k for k,v in disagreement_map.items() if sp in v]
            for t in targets_against_sp:
                if reentry_count.get(t,0) < max_reentries:
                    score = self._priority_score(t, symptoms, parsed_map, recent_content) + 0.7
                    heapq.heappush(event_heap, (-score, seq, {"speaker":t,"reason":"direct_rebut","target":sp}))
                    seq += 1
                    reentry_count[t] = reentry_count.get(t,0) + 1

            # Safety: if heap becomes too big, trim low priority entries to keep behavior focused
            MAX_QUEUE = max(8, len(specialists)*3)
            if len(event_heap) > MAX_QUEUE:
                # pop and drop extra low-priority events (smallest negative priority)
                event_heap = heapq.nsmallest(MAX_QUEUE, event_heap)
                heapq.heapify(event_heap)

        # After event loop ends, create moderator summary as before
        discussion_text = "\n".join(discussion_output)
        moderator_prompt = (
            "Summarize this MDT discussion into EXACTLY the following 5 sections:\n\n"
            "CONDITION SUMMARY:\nPOSSIBLE CAUSES:\nNURSE ACTIONS:\nESCALATION CRITERIA:\nMEDICINES ADVISED:\n\n"
            "RULES:\n- STRICTLY extract from the MDT discussion (no hallucination).\n- Use bullet points.\n- No dosage, no frequency.\n- Never leave any section empty.\n\n"
            "Extract BOTH OTC and 'Doctor may consider X' medications mentioned by specialists.\n\n"
            "Do NOT fabricate medicines.\n\n"
            "Never include dosage or frequency.\n\n"
            f"MDT DISCUSSION:\n{discussion_text}"
        )
        moderator_reply = self.moderator.generate_reply([{"role":"user","content":moderator_prompt}])

        # build debug artifacts (similar to previous layout)
        transcript = self._format_transcript(discussion_log)
        confidence_matrix: Dict[str,int] = {}
        safety_events: List[Dict[str,Any]] = []
        parsed_data: Dict[str,Dict[str,Any]] = {}
        for e in discussion_log:
            role = e.get("role")
            parsed = e.get("parsed",{}) or {}
            if role!="moderator":
                conf = parsed.get("confidence")
                confidence_matrix[role] = int(conf) if isinstance(conf,int) and 1<=conf<=5 else 3
                parsed_data[role] = {"impression":parsed.get("impression"),
                                     "causes":parsed.get("causes"),
                                     "nurse_actions":parsed.get("nurse_actions"),
                                     "escalation":parsed.get("escalation"),
                                     "confidence":confidence_matrix[role]}
            if e.get("redacted"): safety_events.append({"specialist":role,"removed":e.get("redacted")})
            if e.get("question_blocked"): safety_events.append({"specialist":role,"removed":["question_blocked"]})
            if self._meta_regex.search(e.get("content") or ""): safety_events.append({"specialist":role,"removed":["meta_like_phrase"]})

        self._debug_transcript = transcript
        self._debug_turn_log = discussion_log
        self._debug_confidence = confidence_matrix
        self._debug_safety_events = safety_events
        # moderator questions produced in this model are the direct rebut scheduling events we recorded (reentry_count keys)
        self._debug_moderator_questions = [{"to":k,"reentries":v} for k,v in reentry_count.items() if v>0]

        # live printing of final transcript and summary (keeps previous UI)
        if live:
            print("\n" + "="*80)
            print(ANSI["mod"] + "[MODERATOR] FINAL TRANSCRIPT (Judge View)" + ANSI["reset"])
            print("-"*80)
            for entry in discussion_log:
                role_label = entry["role"].upper(); role_color = ANSI["specialist"] if role_label!="MODERATOR" else ANSI["mod"]
                tgt = entry.get("target"); tgt_str = f" → {tgt.upper()}" if tgt else ""; ts = entry.get("time","")
                print(role_color + f"[{ts}] {role_label}{tgt_str}" + ANSI["reset"])
                for line in (entry.get("content") or "").splitlines(): print("  " + line)
                if entry.get("redacted"): print(ANSI["safety"] + "  [SAFETY REDACTED: " + ", ".join(entry.get("redacted")) + "]" + ANSI["reset"])
                if entry.get("question_blocked"): print(ANSI["safety"] + "  [QUESTION BLOCKED]" + ANSI["reset"])
                conf = entry.get("parsed",{}).get("confidence")
                if conf: print(ANSI["confidence"] + f"  Confidence: {conf}/5" + ANSI["reset"])
                print("-"*40)
            print("\n" + ANSI["info"] + "[CONFIDENCE MATRIX]" + ANSI["reset"])
            for k,v in confidence_matrix.items(): print(f"- {k}: {v}/5")
            if self._debug_moderator_questions:
                print("\n" + ANSI["question"] + "[MODERATOR DIRECTED QUESTIONS / REENTRIES]" + ANSI["reset"])
                for q in self._debug_moderator_questions: print(f"- {q['to']}: reentries -> {q['reentries']}")
            if safety_events:
                print("\n" + ANSI["safety"] + "[SAFETY / META LOG]" + ANSI["reset"])
                for s in safety_events: print(f"- {s['specialist']}: events -> {', '.join(s['removed'])}")
            print("\n" + ANSI["mod"] + "[MODERATOR 5-SECTION SUMMARY]" + ANSI["reset"])
            print(moderator_reply)
            print("="*80 + "\n")

        # extract OTC candidates mentioned in moderator_reply (unchanged)
        otc_candidates = []

        return {"symptoms":symptoms,"specialists":specialists,
                "discussion_text":discussion_text,"mdt_summary_raw":moderator_reply,
                "medicines":otc_candidates}
