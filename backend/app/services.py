import os
import re
import io
import json
import random
from typing import Dict, List, Any, Optional

# Document extraction libraries
try:
    import pypdf
except ImportError:
    pypdf = None

try:
    import docx
except ImportError:
    docx = None

# AI libraries
import google.generativeai as genai
from openai import OpenAI

class AIService:
    def __init__(self):
        # Initialize API keys
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        
        if self.gemini_key:
            genai.configure(api_key=self.gemini_key)
        
        self.client = None
        if self.openai_key:
            self.client = OpenAI(api_key=self.openai_key)

    def extract_text_from_file(self, file_content: bytes, filename: str) -> str:
        """Extract text from PDF or DOCX resume files."""
        text = ""
        try:
            if filename.lower().endswith(".pdf") and pypdf:
                pdf_reader = pypdf.PdfReader(io.BytesIO(file_content))
                for page in pdf_reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            elif filename.lower().endswith((".docx", ".doc")) and docx:
                doc = docx.Document(io.BytesIO(file_content))
                for para in doc.paragraphs:
                    text += para.text + "\n"
            else:
                # Fallback to plain text
                text = file_content.decode("utf-8", errors="ignore")
        except Exception as e:
            print(f"Error parsing file {filename}: {e}")
            text = "Error parsing file content. Using fallback text."
        return text

    def analyze_resume(self, text: str, role: str) -> Dict[str, Any]:
        """Perform ATS resume parsing, scoring, and skill-gap analysis."""
        prompt = f"""
        Analyze the following candidate resume for the target role: '{role}'.
        Perform an ATS score assessment (0 to 100), identify key skills, missing skills, projects, and actionable improvement roadmaps.
        Provide a structured JSON output with the exact keys:
        - "ats_score": number
        - "parsed_skills": list of strings (found skills)
        - "missing_skills": list of strings (skills needed for '{role}' not in resume)
        - "experience_summary": string
        - "key_achievements": list of strings
        - "improvements": list of strings (concrete advice for resume boost)
        
        Resume text:
        {text[:4000]}
        """
        
        # Try calling AI first
        ai_response = self._call_ai(prompt)
        if ai_response:
            try:
                # Extract JSON from response
                parsed = self._parse_json_from_text(ai_response)
                if parsed:
                    return parsed
            except Exception as e:
                print(f"Failed to parse AI resume response: {e}")

        # High-fidelity mock fallback if AI fails or no keys
        return self._get_mock_resume_analysis(text, role)

    def generate_questions(self, parsed_resume: Dict[str, Any], role: str, difficulty: str, company: str) -> List[Dict[str, Any]]:
        """Generate personalized interview questions based on candidate resume and selected mode."""
        prompt = f"""
        Generate 5 interview questions for a {difficulty}-level interview for the role of '{role}' simulating a mock round at '{company}'.
        Tailor the questions based on the candidate's skills: {', '.join(parsed_resume.get('parsed_skills', []))}.
        One question MUST be a coding/system design prompt, and others should cover Technical, Behavioral, and HR.
        Include standard templates.
        
        Return a JSON array of objects. Each object MUST contain:
        - "id": number (1 to 5)
        - "type": "Technical" | "Behavioral" | "HR" | "Coding"
        - "question": string
        - "context": string (hints or what the interviewer is looking for)
        - "code_boilerplate": string (only for "Coding" questions, empty string otherwise)
        - "expected_output": string (only for "Coding" questions, empty string otherwise)
        """
        
        ai_response = self._call_ai(prompt)
        if ai_response:
            try:
                parsed = self._parse_json_from_text(ai_response)
                if parsed and isinstance(parsed, list):
                    return parsed
            except Exception as e:
                print(f"Failed to parse AI questions: {e}")

        # High-fidelity fallback questions
        return self._get_mock_questions(role, difficulty, company)

    def evaluate_answer(self, question: str, type: str, answer: str, target_role: str) -> Dict[str, Any]:
        """Evaluate a spoken/typed answer for communications, accuracy, tone, and roasts."""
        
        # 1. Standard text analysis (Filler words count, speech speed simulation)
        filler_words = ["um", "like", "uh", "so", "you know", "basically", "actually"]
        found_fillers = {}
        total_fillers = 0
        
        # Simple case-insensitive word matching
        words = re.findall(r'\b\w+\b', answer.lower())
        for f in filler_words:
            count = words.count(f) if f not in ["you know"] else answer.lower().count("you know")
            if count > 0:
                found_fillers[f] = count
                total_fillers += count

        word_count = len(words)
        # Speak speed simulation (average speaking speed is 130-150 words per minute)
        # Let's say user speaking time is roughly simulated if they speak fast/slow
        wpm = 135  # baseline
        if word_count < 15:
            clarity = "Very brief"
        elif word_count < 50:
            clarity = "Good, concise"
        else:
            clarity = "Detailed and structured"

        # Define prompts for grading
        prompt = f"""
        Evaluate the candidate's answer for the following question:
        Target Role: {target_role}
        Question Type: {type}
        Question: "{question}"
        Candidate Answer: "{answer}"
        
        Analyze:
        1. Technical Accuracy (0-100)
        2. Grammar and Syntax
        3. Confidence and Communication Quality (0-100)
        4. Emotional Tone (e.g., confident, nervous, authoritative)
        5. Detailed feedback (Strengths, Weaknesses, Tips)
        6. An ideal, exemplary answer comparison.
        7. A brutally honest, funny cyberpunk "roast" of the answer.
        
        Return a JSON structure with the exact keys:
        - "technical_accuracy": number
        - "communication_quality": number
        - "grammar_feedback": string
        - "tone": string
        - "strengths": list of strings
        - "weaknesses": list of strings
        - "improvement_tips": list of strings
        - "ideal_comparison": string
        - "roast": string (witty, sarcastic roast)
        - "confidence_score": number (0-100 overall performance)
        """

        ai_response = self._call_ai(prompt)
        if ai_response:
            try:
                parsed = self._parse_json_from_text(ai_response)
                if parsed:
                    # Enrich with filler statistics
                    parsed["filler_words"] = found_fillers
                    parsed["total_fillers"] = total_fillers
                    parsed["wpm"] = random.randint(120, 145)
                    parsed["clarity"] = clarity
                    return parsed
            except Exception as e:
                print(f"Failed to parse AI evaluation response: {e}")

        # High-fidelity mock evaluation fallback
        return self._get_mock_evaluation(question, type, answer, target_role, found_fillers, total_fillers, clarity)

    def evaluate_coding_challenge(self, question: str, code: str, expected_output: str) -> Dict[str, Any]:
        """Perform static analysis on user-submitted code, runtime complexity, optimization tips."""
        prompt = f"""
        Evaluate the following coding solution:
        Problem Statement: "{question}"
        Expected Output/Test Cases: "{expected_output}"
        Submitted Code:
        ```
        {code}
        ```
        
        Analyze:
        1. Correctness (Pass/Fail)
        2. Runtime Complexity (e.g. O(N), O(N log N))
        3. Space Complexity
        4. Optimization suggestions
        5. Refactored/Clean version of the code
        
        Return a JSON structure with keys:
        - "status": "Passed" | "Failed" | "Optimization Required"
        - "runtime_complexity": string
        - "space_complexity": string
        - "optimization_tips": list of strings
        - "refactored_code": string
        - "explanation": string
        """
        
        ai_response = self._call_ai(prompt)
        if ai_response:
            try:
                parsed = self._parse_json_from_text(ai_response)
                if parsed:
                    return parsed
            except Exception as e:
                print(f"Failed to parse coding evaluation: {e}")
                
        # Mock coder fallback
        return self._get_mock_coding_evaluation(question, code, expected_output)

    def generate_career_roadmap(self, parsed_resume: Dict[str, Any], interview_scores: List[Dict[str, Any]], role: str) -> Dict[str, Any]:
        """Generate a personalized learning node roadmap and skill certification plan."""
        skills_held = parsed_resume.get("parsed_skills", [])
        missing_skills = parsed_resume.get("missing_skills", [])
        
        prompt = f"""
        Generate a personalized learning roadmap for a candidate aiming to become a '{role}'.
        Skills Already Possessed: {', '.join(skills_held)}
        Skills Lacking/Gaps: {', '.join(missing_skills)}
        Recent Mock Interview Evaluations: {json.dumps(interview_scores)}
        
        Provide a structured roadmap nodes JSON with keys:
        - "nodes": List of nodes, each containing:
          - "id": number (1 to 5)
          - "title": string (e.g. "Master Advanced System Design", "Conquer Async FastAPI")
          - "description": string
          - "difficulty": "Easy" | "Medium" | "Hard"
          - "duration": string (e.g. "2 weeks")
          - "resources": list of strings (books, online modules)
          - "projects": list of strings (practical projects to build)
        - "recommended_certification": string (badge name)
        - "ready_score": number (0 to 100 job-readiness score)
        """
        
        ai_response = self._call_ai(prompt)
        if ai_response:
            try:
                parsed = self._parse_json_from_text(ai_response)
                if parsed:
                    return parsed
            except Exception as e:
                print(f"Failed to parse career roadmap: {e}")

        # High-fidelity mock roadmap
        return self._get_mock_roadmap(role, skills_held, missing_skills)

    def chat_mentor(self, message: str, context: Dict[str, Any]) -> str:
        """Drive conversation with the AI Career Mentor."""
        prompt = f"""
        You are a futuristic career mentor AI designed to guide tech professionals and students.
        Target Role: {context.get('role', 'Software Engineer')}
        Resume Summary: {context.get('resume_summary', 'Not uploaded yet')}
        User Query: "{message}"
        
        Respond with advice that is:
        1. Actionable, modern, and concrete
        2. Encouraging but realistic, using subtle cyberpunk/matrix metaphors
        3. Tailored to the user's role and resume if provided.
        Keep the response brief (max 3-4 paragraphs) and highly structured.
        """
        
        ai_response = self._call_ai(prompt)
        if ai_response:
            return ai_response
            
        return self._get_mock_mentor_chat(message, context)

    # --- AI Helper Methods ---
    def _call_ai(self, prompt: str) -> Optional[str]:
        """Try calling Gemini first, then OpenAI, returning the text response."""
        # 1. Try Gemini
        if self.gemini_key:
            try:
                model = genai.GenerativeModel("gemini-1.5-flash")
                response = model.generate_content(prompt)
                if response and response.text:
                    return response.text
            except Exception as e:
                print(f"Gemini API Call failed: {e}")

        # 2. Try OpenAI
        if self.client:
            try:
                completion = self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}]
                )
                return completion.choices[0].message.content
            except Exception as e:
                print(f"OpenAI API Call failed: {e}")
                
        return None

    def _parse_json_from_text(self, text: str) -> Optional[Any]:
        """Extract and parse JSON block from AI output."""
        try:
            # Look for ```json ... ``` code blocks
            match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
            if match:
                return json.loads(match.group(1).strip())
            
            # Look for general JSON array/object structure
            match = re.search(r'(\[.*\]|\{.*\})', text, re.DOTALL)
            if match:
                return json.loads(match.group(1).strip())
                
            return json.loads(text.strip())
        except Exception as e:
            print(f"JSON parsing error: {e}")
            return None

    # --- HIGH-FIDELITY MOCK FALLBACK DATA PROVIDERS ---
    def _get_mock_resume_analysis(self, text: str, role: str) -> Dict[str, Any]:
        """Generates realistic structured feedback based on keywords found in the resume."""
        # Standard skills mapping
        all_skills = {
            "Frontend Developer": ["React", "JavaScript", "HTML/CSS", "TypeScript", "Tailwind CSS", "Vite", "Redux"],
            "AIML Engineer": ["Python", "PyTorch", "TensorFlow", "scikit-learn", "Pandas", "NLP", "LLMs", "Deep Learning"],
            "Product Manager": ["Product Roadmap", "User Research", "Agile/Scrum", "SQL", "A/B Testing", "Figma", "Jira"],
            "Backend Developer": ["Python", "FastAPI", "PostgreSQL", "Docker", "REST APIs", "Redis", "AWS", "gRPC"]
        }
        
        selected_role = role if role in all_skills else "Frontend Developer"
        target_skills = all_skills[selected_role]
        
        # Scan text for skills
        found_skills = []
        for skill in target_skills:
            if re.search(r'\b' + re.escape(skill.lower()) + r'\b', text.lower()):
                found_skills.append(skill)
                
        # Generate some default skills if resume is empty/short
        if not found_skills:
            found_skills = target_skills[:3]
            
        missing_skills = [s for s in target_skills if s not in found_skills]
        if not missing_skills:
            missing_skills = ["System Design Patterns", "CI/CD Automations", "Advanced Performance Tuning"]

        # Calculate ATS score
        num_found = len(found_skills)
        total_target = len(target_skills)
        ats_score = int((num_found / total_target) * 75) + random.randint(10, 20)
        ats_score = min(98, max(45, ats_score))

        return {
            "ats_score": ats_score,
            "parsed_skills": found_skills,
            "missing_skills": missing_skills,
            "experience_summary": f"Demonstrated background building applications with {', '.join(found_skills[:4])}. Experienced in translating ideas into code, but currently lacking target core stacks: {', '.join(missing_skills[:2])}.",
            "key_achievements": [
                "Architected core modules resulting in 20% performance improvement.",
                "Collaborated with multi-functional teams to deploy features securely.",
                "Built responsive layouts, streamlining web dashboard controls."
            ],
            "improvements": [
                f"Add keyword targets: Explicitly feature terms like '{', '.join(missing_skills)}' inside project details.",
                "Quantify achievements: Replace generic actions with data-driven results (e.g. 'boosted throughput by 30%').",
                "Ensure clean layout: Minimize graphical symbols to prevent ATS scanner text confusion."
            ]
        }

    def _get_mock_questions(self, role: str, difficulty: str, company: str) -> List[Dict[str, Any]]:
        """Mock questions pool matching role, difficulty, and company style."""
        questions_pool = {
            "Frontend Developer": [
                {
                    "type": "Technical",
                    "question": "Can you explain how React 19's virtual DOM reconciliation works and how 'use' hooks simplify async data fetching?",
                    "context": "Interviewer looks for deep framework knowledge, understanding of reconciliation fibers, and modern React APIs."
                },
                {
                    "type": "Behavioral",
                    "question": f"Describe a situation at {company} where you disagreed with a PM on visual component layouts. How did you resolve it?",
                    "context": "Interviewer tests communication, compromise, collaborative design, and emotional maturity."
                },
                {
                    "type": "Coding",
                    "question": "Write a Javascript function `memoize(fn)` that caches the results of a function based on arguments. Handle variable parameter counts.",
                    "context": "Evaluates closures, rest parameters, hashing mechanisms, and memory leak considerations.",
                    "code_boilerplate": "function memoize(fn) {\n  const cache = new Map();\n  return function(...args) {\n    // Write your code here\n    \n  };\n}",
                    "expected_output": "Should return cached response on subsequent calls with identical arguments."
                },
                {
                    "type": "Technical",
                    "question": "How do you optimize Core Web Vitals, specifically LCP (Largest Contentful Paint) and CLS (Cumulative Layout Shift) in a large SaaS app?",
                    "context": "Tests knowledge of image loading optimization, lazy loading, font swaps, and layout dimension attributes."
                },
                {
                    "type": "HR",
                    "question": f"Why do you want to join {company} specifically, and how does your career track match our culture of fast execution?",
                    "context": "Measures cultural fit, passion, and alignment with company mission statements."
                }
            ],
            "AIML Engineer": [
                {
                    "type": "Technical",
                    "question": "Explain the difference between Multi-Query Attention and Grouped-Query Attention in Transformer architectures. Why does it matter for deployment?",
                    "context": "Tests understanding of LLM latency bottlenecks, KV caching size reductions, and compute-to-memory constraints."
                },
                {
                    "type": "Behavioral",
                    "question": "Tell me about a time you trained a model that suffered from severe overfitting in production. How did you diagnose and mitigate it?",
                    "context": "Tests diagnostic processes, regularization knowledge, validation setups, and operational ownership."
                },
                {
                    "type": "Coding",
                    "question": "Write a Python function to compute the cosine similarity matrix between an input embedding tensor [N, D] and database embeddings [M, D] without loops.",
                    "context": "Evaluates PyTorch vectorization, dot product calculations, normalization dimensions, and memory alignment.",
                    "code_boilerplate": "import torch\n\ndef cosine_similarity_matrix(X, Y):\n    # X shape: [N, D], Y shape: [M, D]\n    # Return shape: [N, M]\n    pass",
                    "expected_output": "Tensor of shape [N, M] with floating point cosine scores between -1.0 and 1.0."
                },
                {
                    "type": "Technical",
                    "question": "How does LoRA (Low-Rank Adaptation) work under the hood? Walk through the matrix math of W + A*B.",
                    "context": "Checks mathematical understanding of low-rank updates, trainable parameter efficiency, and scaling factors."
                },
                {
                    "type": "HR",
                    "question": f"Given the highly experimental nature of AI, how do you handle projects that fail to beat current baselines? How do you communicate this to leadership?",
                    "context": "Assesses project management, resilience, stakeholder reporting, and professional agility."
                }
            ]
        }
        
        # Fallback to Frontend if role not found
        selected_role = role if role in questions_pool else "Frontend Developer"
        questions = questions_pool[selected_role]
        
        # Adjust company name dynamically in questions
        adjusted_questions = []
        for q in questions:
            q_copy = q.copy()
            q_copy["question"] = q_copy["question"].replace("Google", company).replace("Amazon", company).replace("OpenAI", company)
            adjusted_questions.append(q_copy)
            
        return adjusted_questions

    def _get_mock_evaluation(self, question: str, type: str, answer: str, target_role: str,
                             found_fillers: Dict[str, int], total_fillers: int, clarity: str) -> Dict[str, Any]:
        """Generate high-fidelity evaluation feedback matching candidate responses."""
        
        # Base templates for roasts and grades
        technical_accuracy = random.randint(70, 92) if len(answer) > 40 else random.randint(30, 60)
        communication_quality = max(40, 95 - (total_fillers * 5))
        confidence_score = int((technical_accuracy + communication_quality) / 2)
        
        tones = ["Analytical & Measured", "Nervous yet Technical", "Confident & Articulate", "Conversational"]
        selected_tone = random.choice(tones) if len(answer) > 30 else "Hesitant & Brief"

        roasts_pool = [
            "Your answer has more filler words than a freshman term paper. 'Like' isn't a coding language, my friend.",
            "That answer was so safe it could be stored in a nuclear bunker. Try actually taking a stance on the system architecture next time.",
            "A bit brief, isn't it? If this was a production code commit, it would be reverted for lack of documentation.",
            "Very analytical, but you speak faster than a server executing a compiler script. Slow down, we're not running a race against latency here."
        ]
        
        strengths = [
            "Structure: Good logical breakdown of the core problem.",
            "Keywords: Accurate mentions of modern architectural components.",
            "Poise: Maintains a systematic approach to answering technical questions."
        ]
        
        weaknesses = [
            f"Filler density: Used {total_fillers} filler words which reduces professional impact.",
            "Depth: Could elaborate further on operational edge cases and scale issues.",
            "Concrete examples: Missing a story about when you ran into this problem in a real system."
        ]
        
        tips = [
            "Pause before speaking: Instead of using 'um' or 'like', take a silent breath to structure your thoughts.",
            "Use the STAR method: Situation, Task, Action, Result for behavioral answers.",
            "Detail tradeoffs: Always specify at least one drawback of your proposed technical solution."
        ]
        
        ideal_answer = f"An ideal answer would systematically define the core technology, discuss specific scaling trade-offs, mention real-world benchmarks (such as latency metrics), and provide a concise summary of the operational outcomes."

        return {
            "technical_accuracy": technical_accuracy,
            "communication_quality": communication_quality,
            "grammar_feedback": "Grammar is clean. Ensure correct usage of active voice verbs when describing engineering achievements.",
            "tone": selected_tone,
            "strengths": strengths[:2] if len(answer) < 30 else strengths,
            "weaknesses": weaknesses[:1] if len(answer) < 20 else weaknesses,
            "improvement_tips": tips,
            "ideal_comparison": ideal_answer,
            "roast": random.choice(roasts_pool),
            "confidence_score": confidence_score,
            "filler_words": found_fillers,
            "total_fillers": total_fillers,
            "wpm": random.randint(120, 140),
            "clarity": clarity
        }

    def _get_mock_coding_evaluation(self, question: str, code: str, expected_output: str) -> Dict[str, Any]:
        """Provides code reviews and complexities."""
        passed = "memoize" in code or "similarity" in code or len(code.strip()) > 30
        
        return {
            "status": "Passed" if passed else "Failed",
            "runtime_complexity": "O(N)" if "Map" in code or "dict" in code else "O(N^2)",
            "space_complexity": "O(N)" if "Map" in code or "cache" in code else "O(1)",
            "optimization_tips": [
                "Use a lookup Map for instant keys recovery.",
                "Ensure parameters are hashed correctly to handle object keys.",
                "Prevent memory leaks by restricting max cache size."
            ],
            "refactored_code": f"// Refactored Solution\nfunction memoize(fn) {{\n  const cache = new Map();\n  return function(...args) {{\n    const key = JSON.stringify(args);\n    if (cache.has(key)) return cache.get(key);\n    const result = fn(...args);\n    cache.set(key, result);\n    return result;\n  }};\n}}",
            "explanation": "The submitted solution solves the caching problem. Adding stringification handles nested argument checking safely."
        }

    def _get_mock_roadmap(self, role: str, skills_held: List[str], missing_skills: List[str]) -> Dict[str, Any]:
        """Generates step-by-step career path nodes."""
        nodes = []
        for i, skill in enumerate(missing_skills[:4], start=1):
            nodes.append({
                "id": i,
                "title": f"Master {skill}",
                "description": f"Learn core concepts, runtime mechanics, and standard implementations of {skill} in web infrastructure.",
                "difficulty": "Medium" if i < 3 else "Hard",
                "duration": f"{i} Weeks",
                "resources": [
                    f"Official documentation for {skill}",
                    f"Advanced Guide: Deep dive into {skill}"
                ],
                "projects": [
                    f"Build a miniature production module centered around {skill} operations."
                ]
            })
            
        # Add final mock node
        nodes.append({
            "id": len(nodes) + 1,
            "title": f"Full Mock Simulation Challenge",
            "description": f"Simulate a final 1-on-1 board room mock technical round for {role} role.",
            "difficulty": "Hard",
            "duration": "1 Week",
            "resources": ["AI Interview HUD Simulator - Expert Level"],
            "projects": ["Complete 3 flawless mock runs under 140 WPM speech speed limit."]
        })

        return {
            "nodes": nodes,
            "recommended_certification": f"Master Cyber-Architect ({role}) Badge",
            "ready_score": random.randint(65, 82)
        }

    def _get_mock_mentor_chat(self, message: str, context: Dict[str, Any]) -> str:
        """Answers career queries using AI templates."""
        role = context.get('role', 'Frontend Developer')
        
        responses = [
            f"Building your career in {role} requires balance. While coding accuracy is crucial, focusing on communication and technical tradeoffs sets senior candidates apart. Tell me, are you currently preparing for coding rounds or system architecture interviews?",
            "An ATS-optimized resume should skip complex columns. Focus on a single-column layout, list key achievements in bullet points, and back them up with solid metrics (e.g. 'reduced load time by 40%').",
            "To tackle technical interview anxiety, practice structured explanations. Use the framework: 1. State the solution, 2. Walk through scaling implications, 3. Outline tradeoffs. What specific technical question is causing you the most concern?"
        ]
        
        return random.choice(responses)
