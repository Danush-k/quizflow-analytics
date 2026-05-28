from app.database.db import get_db
from datetime import datetime, timedelta
from faker import Faker
import uuid
import random
import logging

logger = logging.getLogger(__name__)

class DataSeeder:
    fake = Faker()
    
    @staticmethod
    async def seed_all_data(clear_existing: bool = True) -> dict:
        """Seed all dummy data"""
        db = await get_db()
        
        if clear_existing:
            await DataSeeder._clear_all_collections(db)
        
        # Seed hierarchical data first
        exams = await DataSeeder._seed_exams(db)
        subjects = await DataSeeder._seed_subjects(db, exams)
        chapters = await DataSeeder._seed_chapters(db, subjects)
        await DataSeeder._seed_questions(db, chapters)
        
        # Then seed user data
        users = await DataSeeder._seed_users(db)
        
        # Then seed quiz sessions and responses
        await DataSeeder._seed_quiz_sessions_and_responses(db, users, chapters)
        
        logger.info("✓ Data seeding complete")
        
        return {
            "exams_created": len(exams),
            "subjects_created": len(subjects),
            "chapters_created": len(chapters),
            "users_created": len(users),
            "message": "Seeding complete"
        }
    
    @staticmethod
    async def _clear_all_collections(db):
        """Clear all collections"""
        collections = ["users", "exams", "subjects", "chapters", "questions", "quiz_sessions", "responses", "analytics"]
        for col in collections:
            await db[col].delete_many({})
        logger.info("✓ Collections cleared")
    
    @staticmethod
    async def _seed_exams(db) -> list:
        """Create 10 exams"""
        exam_names = ["JEE Main", "NEET", "UPSC", "CAT", "Gate", "SSC", "Bank PO", "CLAT", "SAT", "GRE"]
        exams = []
        
        for name in exam_names:
            exam_id = f"exam_{name.lower().replace(' ', '_')}"
            exam = {
                "exam_id": exam_id,
                "name": name,
                "description": f"{name} Examination",
                "created_at": datetime.utcnow(),
                "total_subjects": 5,
                "total_questions": 2000
            }
            await db["exams"].insert_one(exam)
            exams.append(exam)
        
        logger.info(f"✓ Created {len(exams)} exams")
        return exams
    
    @staticmethod
    async def _seed_subjects(db, exams) -> list:
        """Create 50 subjects (5 per exam)"""
        subject_names = ["Physics", "Chemistry", "Biology", "Mathematics", "English"]
        subjects = []
        
        for exam in exams:
            for subject_name in subject_names:
                subject_id = f"subj_{exam['exam_id']}_{subject_name.lower()}"
                subject = {
                    "subject_id": subject_id,
                    "exam_id": exam["exam_id"],
                    "name": subject_name,
                    "created_at": datetime.utcnow(),
                    "total_chapters": 4,
                    "total_questions": 200
                }
                await db["subjects"].insert_one(subject)
                subjects.append(subject)
        
        logger.info(f"✓ Created {len(subjects)} subjects")
        return subjects
    
    @staticmethod
    async def _seed_chapters(db, subjects) -> list:
        """Create 200 chapters (4 per subject)"""
        chapter_templates = ["Fundamentals", "Advanced Concepts", "Problem Solving", "Mixed Topics"]
        chapters = []
        
        for subject in subjects:
            for chapter_name in chapter_templates:
                chapter_id = f"chap_{subject['subject_id']}_{chapter_name.lower().replace(' ', '_')}"
                chapter = {
                    "chapter_id": chapter_id,
                    "subject_id": subject["subject_id"],
                    "name": f"{subject['name']} - {chapter_name}",
                    "created_at": datetime.utcnow(),
                    "total_questions": 10
                }
                await db["chapters"].insert_one(chapter)
                chapters.append(chapter)
        
        logger.info(f"✓ Created {len(chapters)} chapters")
        return chapters
    
    @staticmethod
    async def _seed_questions(db, chapters) -> int:
        """Create 2000 questions (10 per chapter) with realistic content"""
        count = 0
        
        # Question bank organized by subject
        question_bank = {
            "Physics": [
                {
                    "text": "What is the SI unit of force?",
                    "options": ["Newton", "Joule", "Pascal", "Watt"],
                    "correct": "Newton"
                },
                {
                    "text": "Which law of motion states F = ma?",
                    "options": ["First Law", "Second Law", "Third Law", "Law of Inertia"],
                    "correct": "Second Law"
                },
                {
                    "text": "What is the speed of light in vacuum?",
                    "options": ["3×10^7 m/s", "3×10^8 m/s", "3×10^9 m/s", "3×10^6 m/s"],
                    "correct": "3×10^8 m/s"
                },
                {
                    "text": "Who discovered the law of universal gravitation?",
                    "options": ["Galileo", "Newton", "Kepler", "Einstein"],
                    "correct": "Newton"
                },
                {
                    "text": "What is the formula for kinetic energy?",
                    "options": ["mgh", "½mv²", "mg", "mv"],
                    "correct": "½mv²"
                },
            ],
            "Chemistry": [
                {
                    "text": "What is the atomic number of Carbon?",
                    "options": ["4", "6", "8", "12"],
                    "correct": "6"
                },
                {
                    "text": "What is the chemical formula for table salt?",
                    "options": ["NaCl", "KCl", "CaCl2", "NaOH"],
                    "correct": "NaCl"
                },
                {
                    "text": "Which gas is most abundant in Earth's atmosphere?",
                    "options": ["Oxygen", "Hydrogen", "Nitrogen", "Carbon Dioxide"],
                    "correct": "Nitrogen"
                },
                {
                    "text": "What is the pH of a neutral solution?",
                    "options": ["0", "7", "14", "1"],
                    "correct": "7"
                },
                {
                    "text": "Which element has the symbol 'Au'?",
                    "options": ["Silver", "Gold", "Aluminum", "Argon"],
                    "correct": "Gold"
                },
            ],
            "Biology": [
                {
                    "text": "What is the powerhouse of the cell?",
                    "options": ["Nucleus", "Mitochondria", "Ribosome", "Vacuole"],
                    "correct": "Mitochondria"
                },
                {
                    "text": "How many chambers does the human heart have?",
                    "options": ["2", "3", "4", "5"],
                    "correct": "4"
                },
                {
                    "text": "What is the basic unit of life?",
                    "options": ["Atom", "Molecule", "Cell", "Tissue"],
                    "correct": "Cell"
                },
                {
                    "text": "Which organelle is responsible for protein synthesis?",
                    "options": ["Mitochondria", "Golgi Apparatus", "Ribosome", "Lysosome"],
                    "correct": "Ribosome"
                },
                {
                    "text": "What is the process by which plants make their own food?",
                    "options": ["Respiration", "Photosynthesis", "Fermentation", "Digestion"],
                    "correct": "Photosynthesis"
                },
            ],
            "Mathematics": [
                {
                    "text": "What is the value of π (pi)?",
                    "options": ["3.12", "3.14", "3.16", "3.18"],
                    "correct": "3.14"
                },
                {
                    "text": "What is the derivative of x² with respect to x?",
                    "options": ["x", "2x", "2", "x²"],
                    "correct": "2x"
                },
                {
                    "text": "What is the solution to 2x + 3 = 7?",
                    "options": ["1", "2", "3", "4"],
                    "correct": "2"
                },
                {
                    "text": "What is the area of a circle with radius 5?",
                    "options": ["25π", "10π", "5π", "100π"],
                    "correct": "25π"
                },
                {
                    "text": "What is 25% of 200?",
                    "options": ["25", "50", "75", "100"],
                    "correct": "50"
                },
            ],
            "English": [
                {
                    "text": "Which is a noun?",
                    "options": ["Run", "Happy", "Book", "Quickly"],
                    "correct": "Book"
                },
                {
                    "text": "What is the past tense of 'go'?",
                    "options": ["Goed", "Going", "Went", "Goes"],
                    "correct": "Went"
                },
                {
                    "text": "Which word is a verb?",
                    "options": ["Blue", "Jump", "Quick", "Beautiful"],
                    "correct": "Jump"
                },
                {
                    "text": "What is the plural of 'child'?",
                    "options": ["Childs", "Children", "Childes", "Chilren"],
                    "correct": "Children"
                },
                {
                    "text": "Which sentence is grammatically correct?",
                    "options": ["She go to school", "She goes to school", "She going to school", "She gone to school"],
                    "correct": "She goes to school"
                },
            ]
        }
        
        for chapter in chapters:
            # Determine subject from chapter name
            subject_match = None
            for subject in question_bank.keys():
                if subject.lower() in chapter['name'].lower():
                    subject_match = subject
                    break
            
            if not subject_match:
                subject_match = "Mathematics"  # Default fallback
            
            questions = question_bank[subject_match]
            
            for q_num in range(10):
                question_id = f"q_{chapter['chapter_id']}_{q_num:02d}"
                q_template = questions[q_num % len(questions)]
                
                # Shuffle options so correct answer isn't always first
                options = q_template["options"].copy()
                random.shuffle(options)
                
                question = {
                    "question_id": question_id,
                    "chapter_id": chapter["chapter_id"],
                    "question_text": q_template["text"],
                    "options": options,
                    "correct_answer": q_template["correct"],
                    "difficulty": random.choice(["easy", "medium", "hard"]),
                    "created_at": datetime.utcnow()
                }
                await db["questions"].insert_one(question)
                count += 1
        
        logger.info(f"✓ Created {count} questions with realistic content")
        return count
    
    @staticmethod
    async def _seed_users(db, count: int = 10) -> list:
        """Create 10 users for light testing"""
        users = []
        
        for i in range(count):
            user_id = f"usr_{uuid.uuid4().hex[:12]}"
            user = {
                "user_id": user_id,
                "name": DataSeeder.fake.name(),
                "email": DataSeeder.fake.email(),
                "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 30)),
                "last_active": datetime.utcnow() - timedelta(hours=random.randint(0, 24)),
                "total_sessions": 0,
                "total_correct": 0
            }
            await db["users"].insert_one(user)
            users.append(user)
        
        logger.info(f"✓ Created {count} users")
        return users
    
    @staticmethod
    async def _seed_quiz_sessions_and_responses(db, users, chapters) -> int:
        """Create a few quiz sessions with responses"""
        session_count = 0
        response_count = 0
        
        for user in users:
            # Each user takes 2 quizzes
            for _ in range(2):
                chapter = random.choice(chapters)
                questions = await db["questions"].find(
                    {"chapter_id": chapter["chapter_id"]}
                ).to_list(length=None)
                
                session_id = f"sess_{uuid.uuid4().hex[:12]}"
                
                # 70% completion rate
                completed = random.random() < 0.7
                questions_attempted = len(questions) if completed else random.randint(1, len(questions) - 1)
                
                correct_count = 0
                answers = []
                
                # Create responses
                for idx in range(questions_attempted):
                    q = questions[idx]
                    is_correct = random.random() < 0.6  # 60% correct rate
                    if is_correct:
                        correct_count += 1
                    
                    user_answer = q["correct_answer"] if is_correct else random.choice(
                        [opt for opt in q["options"] if opt != q["correct_answer"]]
                    )
                    answers.append(user_answer)
                    
                    # Create response record
                    response = {
                        "response_id": f"resp_{uuid.uuid4().hex[:12]}",
                        "session_id": session_id,
                        "question_id": q["question_id"],
                        "user_answer": user_answer,
                        "is_correct": is_correct,
                        "question_shown_at": datetime.utcnow() - timedelta(seconds=random.randint(300, 3600)),
                        "answer_submitted_at": datetime.utcnow() - timedelta(seconds=random.randint(0, 300)),
                        "response_duration_ms": random.randint(5000, 60000)
                    }
                    await db["responses"].insert_one(response)
                    response_count += 1
                
                # Create session
                started = datetime.utcnow() - timedelta(days=random.randint(0, 30))
                session = {
                    "session_id": session_id,
                    "user_id": user["user_id"],
                    "chapter_id": chapter["chapter_id"],
                    "created_at": started,
                    "started_at": started,
                    "completed_at": started + timedelta(seconds=questions_attempted * 30) if completed else None,
                    "status": "completed" if completed else "abandoned",
                    "total_questions": len(questions),
                    "correct_answers": correct_count,
                    "score": int((correct_count / questions_attempted) * 100) if questions_attempted > 0 else 0,
                    "current_question_index": questions_attempted,
                    "answers": answers
                }
                await db["quiz_sessions"].insert_one(session)
                session_count += 1
        
        logger.info(f"✓ Created {session_count} quiz sessions and {response_count} responses")
        return session_count
