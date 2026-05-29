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
        """Create exactly 2 premium exams (JEE Main and NEET)"""
        exams_data = [
            {
                "exam_id": "exam_jee_main",
                "name": "JEE Main",
                "description": "National level entrance test for premier engineering institutes like IITs, NITs, and IIITs.",
                "created_at": datetime.utcnow(),
                "total_subjects": 3,
                "total_questions": 90
            },
            {
                "exam_id": "exam_neet",
                "name": "NEET",
                "description": "National level eligibility cum entrance test for medical aspirants entering MBBS/BDS courses.",
                "created_at": datetime.utcnow(),
                "total_subjects": 3,
                "total_questions": 90
            }
        ]
        
        exams = []
        for exam in exams_data:
            await db["exams"].insert_one(exam)
            exams.append(exam)
        
        logger.info(f"✓ Created {len(exams)} exams")
        return exams
    
    @staticmethod
    async def _seed_subjects(db, exams) -> list:
        """Create subjects specifically tailored to each exam"""
        exam_subjects = {
            "exam_jee_main": ["Physics", "Chemistry", "Mathematics"],
            "exam_neet": ["Physics", "Chemistry", "Biology"]
        }
        
        subjects = []
        for exam in exams:
            subjects_list = exam_subjects.get(exam["exam_id"], [])
            for subject_name in subjects_list:
                subject_id = f"subj_{exam['exam_id']}_{subject_name.lower()}"
                subject = {
                    "subject_id": subject_id,
                    "exam_id": exam["exam_id"],
                    "name": subject_name,
                    "created_at": datetime.utcnow(),
                    "total_chapters": 3,
                    "total_questions": 30
                }
                await db["subjects"].insert_one(subject)
                subjects.append(subject)
        
        logger.info(f"✓ Created {len(subjects)} subjects")
        return subjects
    
    @staticmethod
    async def _seed_chapters(db, subjects) -> list:
        """Create realistic, professional chapters per subject"""
        exam_subject_chapters = {
            "exam_jee_main": {
                "Physics": ["Mechanics", "Electromagnetism", "Thermodynamics"],
                "Chemistry": ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry"],
                "Mathematics": ["Calculus", "Algebra", "Coordinate Geometry"]
            },
            "exam_neet": {
                "Physics": ["Mechanics", "Optics", "Modern Physics"],
                "Chemistry": ["Chemical Bonding", "Equilibrium", "Organic Compounds"],
                "Biology": ["Cell Biology", "Genetics", "Human Physiology"]
            }
        }
        
        chapters = []
        for subject in subjects:
            chapters_list = exam_subject_chapters.get(subject["exam_id"], {}).get(subject["name"], [])
            for chapter_name in chapters_list:
                chapter_id = f"chap_{subject['subject_id']}_{chapter_name.lower().replace(' ', '_')}"
                chapter = {
                    "chapter_id": chapter_id,
                    "subject_id": subject["subject_id"],
                    "exam_id": subject["exam_id"],
                    "subject_name": subject["name"],
                    "chapter_name": chapter_name,
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
        """Create exactly 180 handcrafted, high-fidelity, completely unique multiple-choice questions (10 per chapter)"""
        count = 0
        
        # High fidelity handcrafted question bank with exactly 10 unique questions per chapter
        question_bank = {
            "exam_jee_main": {
                "Physics": {
                    "Mechanics": [
                        {
                            "text": "A particle moves along a straight line such that its displacement at any time t is given by s = t³ - 6t² + 3t + 4 meters. Find the velocity when the acceleration is zero.",
                            "options": ["-9 m/s", "-12 m/s", "-3 m/s", "0 m/s"],
                            "correct": "-9 m/s"
                        },
                        {
                            "text": "A block of mass 2 kg is placed on a rough horizontal surface with coefficient of static friction 0.4. If a horizontal force of 6 N is applied, the frictional force acting on the block is:",
                            "options": ["6 N", "8 N", "7.84 N", "0 N"],
                            "correct": "6 N"
                        },
                        {
                            "text": "The moment of inertia of a uniform thin rod of mass M and length L about an axis passing through its center and perpendicular to its length is:",
                            "options": ["ML²/12", "ML²/3", "ML²/2", "ML²/4"],
                            "correct": "ML²/12"
                        },
                        {
                            "text": "A satellite is orbiting close to the Earth's surface. What is its approximate orbital velocity?",
                            "options": ["7.9 km/s", "11.2 km/s", "9.8 km/s", "5.6 km/s"],
                            "correct": "7.9 km/s"
                        },
                        {
                            "text": "A body of mass 5 kg is moving in a circle of radius 1 m with an angular velocity of 2 rad/s. The centripetal force acting on the body is:",
                            "options": ["20 N", "10 N", "5 N", "40 N"],
                            "correct": "20 N"
                        },
                        {
                            "text": "A solid sphere of mass M and radius R rolls without slipping on a horizontal surface. What is the ratio of its rotational kinetic energy to its total kinetic energy?",
                            "options": ["2/7", "2/5", "1/2", "5/7"],
                            "correct": "2/7"
                        },
                        {
                            "text": "A bullet of mass 10 g moving with 300 m/s hits a wooden block and penetrates 10 cm before coming to rest. The average resistive force exerted by the block is:",
                            "options": ["4500 N", "9000 N", "3000 N", "1500 N"],
                            "correct": "4500 N"
                        },
                        {
                            "text": "The escape velocity from the Earth's surface is ve. If the mass of the Earth becomes four times and its radius is doubled, the new escape velocity will be:",
                            "options": ["√2 ve", "2 ve", "ve / √2", "ve"],
                            "correct": "√2 ve"
                        },
                        {
                            "text": "A body of mass m is raised to a height h = R from the Earth's surface, where R is the radius of the Earth. The change in potential energy is:",
                            "options": ["½ mgR", "mgR", "2 mgR", "¼ mgR"],
                            "correct": "½ mgR"
                        },
                        {
                            "text": "A constant torque of 1000 N-m turns a wheel of moment of inertia 200 kg-m² about an axis. Find the angular acceleration of the wheel.",
                            "options": ["5 rad/s²", "10 rad/s²", "2 rad/s²", "4 rad/s²"],
                            "correct": "5 rad/s²"
                        }
                    ],
                    "Electromagnetism": [
                        {
                            "text": "Two point charges +3 μC and +8 μC repel each other with a force of 40 N. If a charge of -5 μC is added to each of them, the force between them will become:",
                            "options": ["-10 N (attractive)", "10 N (repulsive)", "20 N (attractive)", "-20 N (attractive)"],
                            "correct": "-10 N (attractive)"
                        },
                        {
                            "text": "A wire of resistance R is stretched to twice its original length. Its new resistance will be:",
                            "options": ["4R", "2R", "R/2", "R/4"],
                            "correct": "4R"
                        },
                        {
                            "text": "The magnetic field at the center of a circular coil of radius r carrying current I is:",
                            "options": ["μ₀I / 2r", "μ₀I / r", "μ₀I / 4r", "2μ₀I / r"],
                            "correct": "μ₀I / 2r"
                        },
                        {
                            "text": "A transformer works on the principle of:",
                            "options": ["Mutual induction", "Self induction", "Electromagnetic radiation", "Lorentz force"],
                            "correct": "Mutual induction"
                        },
                        {
                            "text": "The energy density in a magnetic field B in free space is given by:",
                            "options": ["B² / 2μ₀", "B / 2μ₀", "B²μ₀ / 2", "B² / μ₀"],
                            "correct": "B² / 2μ₀"
                        },
                        {
                            "text": "The electrostatic potential at a point on the axial line of an electric dipole at distance r from its center is proportional to:",
                            "options": ["1/r²", "1/r", "1/r³", "r"],
                            "correct": "1/r²"
                        },
                        {
                            "text": "A circular loop of radius r carries current I. The magnetic dipole moment of the loop is:",
                            "options": ["I * πr²", "I * 2πr", "I / πr²", "2I * πr²"],
                            "correct": "I * πr²"
                        },
                        {
                            "text": "A charged particle moves with velocity v in a uniform magnetic field B. The force is zero when the angle between v and B is:",
                            "options": ["0° or 180°", "90°", "45°", "270°"],
                            "correct": "0° or 180°"
                        },
                        {
                            "text": "Which of the following Maxwell's equations expresses the absence of magnetic monopoles?",
                            "options": ["div B = 0", "div E = ρ/ε₀", "curl E = -∂B/∂t", "curl B = μ₀J"],
                            "correct": "div B = 0"
                        },
                        {
                            "text": "In an LCR series AC circuit at resonance, the phase difference between current and voltage is:",
                            "options": ["0", "π/2", "π/4", "π"],
                            "correct": "0"
                        }
                    ],
                    "Thermodynamics": [
                        {
                            "text": "An ideal gas heat engine operates in a Carnot cycle between 227°C and 127°C. It absorbs 6 kcal of heat at the higher temperature. The amount of heat converted into work is:",
                            "options": ["1.2 kcal", "4.8 kcal", "2.4 kcal", "3.6 kcal"],
                            "correct": "1.2 kcal"
                        },
                        {
                            "text": "Which of the following processes is a constant volume process?",
                            "options": ["Isochoric", "Isobaric", "Isothermal", "Adiabatic"],
                            "correct": "Isochoric"
                        },
                        {
                            "text": "For an adiabatic process, the relation between pressure P and volume V of an ideal gas is:",
                            "options": ["PV^γ = Constant", "PV = Constant", "P/V = Constant", "P^γV = Constant"],
                            "correct": "PV^γ = Constant"
                        },
                        {
                            "text": "The efficiency of a Carnot engine operating between temperatures T1 (source) and T2 (sink) is:",
                            "options": ["1 - T2/T1", "1 - T1/T2", "T2/T1", "T1/T2"],
                            "correct": "1 - T2/T1"
                        },
                        {
                            "text": "According to the kinetic theory of gases, the absolute temperature of a gas is proportional to:",
                            "options": ["Mean translational kinetic energy of molecules", "Mean square velocity of molecules", "Mean speed of molecules", "Root mean square velocity of molecules"],
                            "correct": "Mean translational kinetic energy of molecules"
                        },
                        {
                            "text": "During an isothermal expansion of an ideal gas, which of the following remains constant?",
                            "options": ["Internal energy", "Pressure", "Volume", "Entropy"],
                            "correct": "Internal energy"
                        },
                        {
                            "text": "The ratio of specific heats Cp/Cv for a monatomic gas is:",
                            "options": ["5/3", "7/5", "4/3", "9/7"],
                            "correct": "5/3"
                        },
                        {
                            "text": "If the temperature of the source of a Carnot engine is increased, its efficiency will:",
                            "options": ["Increase", "Decrease", "Remain constant", "First decrease then increase"],
                            "correct": "Increase"
                        },
                        {
                            "text": "The work done in an isochoric process is:",
                            "options": ["Zero", "P(V2 - V1)", "nRT ln(V2/V1)", "Q"],
                            "correct": "Zero"
                        },
                        {
                            "text": "A system absorbs 500 J of heat and does 200 J of work. The change in internal energy of the system is:",
                            "options": ["300 J", "700 J", "-300 J", "500 J"],
                            "correct": "300 J"
                        }
                    ]
                },
                "Chemistry": {
                    "Organic Chemistry": [
                        {
                            "text": "Which of the following is the strongest acid among these?",
                            "options": ["Trichloroacetic acid", "Dichloroacetic acid", "Monochloroacetic acid", "Acetic acid"],
                            "correct": "Trichloroacetic acid"
                        },
                        {
                            "text": "The reaction of an alkyl halide with sodium metal in dry ether to form a symmetrical alkane is known as:",
                            "options": ["Wurtz reaction", "Fittig reaction", "Friedel-Crafts reaction", "Grignard reaction"],
                            "correct": "Wurtz reaction"
                        },
                        {
                            "text": "Which of the following undergoes nucleophilic substitution exclusively by SN1 mechanism?",
                            "options": ["tert-Butyl chloride", "Ethyl chloride", "Isopropyl chloride", "Chlorobenzene"],
                            "correct": "tert-Butyl chloride"
                        },
                        {
                            "text": "The IUPAC name of CH3-CH(OH)-CH2-CHO is:",
                            "options": ["3-Hydroxybutanal", "2-Hydroxybutanal", "3-Hydroxybutane", "1-Oxobutan-3-ol"],
                            "correct": "3-Hydroxybutanal"
                        },
                        {
                            "text": "Which reagent is used to distinguish between aldehydes and ketones?",
                            "options": ["Tollens' reagent", "Lucas reagent", "Grignard reagent", "Bromine water"],
                            "correct": "Tollens' reagent"
                        },
                        {
                            "text": "Which of the following shows geometrical isomerism?",
                            "options": ["But-2-ene", "Propene", "But-1-ene", "2-Methylpropene"],
                            "correct": "But-2-ene"
                        },
                        {
                            "text": "The reaction of phenol with chloroform in the presence of aqueous NaOH to form salicylaldehyde is called:",
                            "options": ["Reimer-Tiemann reaction", "Kolbe's reaction", "Rosenmund reduction", "Cannizzaro reaction"],
                            "correct": "Reimer-Tiemann reaction"
                        },
                        {
                            "text": "Which of the following is most basic in aqueous solution?",
                            "options": ["Dimethylamine", "Methylamine", "Trimethylamine", "Aniline"],
                            "correct": "Dimethylamine"
                        },
                        {
                            "text": "What is the primary product of the reaction of toluene with CrO2Cl2 followed by hydrolysis (Etard reaction)?",
                            "options": ["Benzaldehyde", "Benzoic acid", "Benzyl alcohol", "Benzoyl chloride"],
                            "correct": "Benzaldehyde"
                        },
                        {
                            "text": "Which of the following compounds will not give a positive Fehling's test?",
                            "options": ["Benzaldehyde", "Acetaldehyde", "Formaldehyde", "Glucose"],
                            "correct": "Benzaldehyde"
                        }
                    ],
                    "Inorganic Chemistry": [
                        {
                            "text": "Which of the following hydrides of Group 15 elements has the highest boiling point?",
                            "options": ["BiH3", "NH3", "PH3", "AsH3"],
                            "correct": "BiH3"
                        },
                        {
                            "text": "The shape of XeF4 molecule according to VSEPR theory is:",
                            "options": ["Square planar", "Tetrahedral", "Octahedral", "Linear"],
                            "correct": "Square planar"
                        },
                        {
                            "text": "Which d-block element does not show variable oxidation states?",
                            "options": ["Scandium", "Iron", "Copper", "Manganese"],
                            "correct": "Scandium"
                        },
                        {
                            "text": "The coordination number of cobalt in [Co(en)3]3+ is:",
                            "options": ["6", "3", "4", "2"],
                            "correct": "6"
                        },
                        {
                            "text": "Which of the following ligands is a bidentate ligand?",
                            "options": ["Ethylenediamine", "Ammonia", "Water", "Carbon monoxide"],
                            "correct": "Ethylenediamine"
                        },
                        {
                            "text": "Which of the following transitions has the highest energy in hydrogen spectrum?",
                            "options": ["n=2 to n=1", "n=3 to n=2", "n=4 to n=3", "n=5 to n=4"],
                            "correct": "n=2 to n=1"
                        },
                        {
                            "text": "The correct order of electronegativity among N, O, F, and Cl is:",
                            "options": ["F > O > Cl > N", "F > O > N > Cl", "F > Cl > O > N", "O > F > Cl > N"],
                            "correct": "F > O > Cl > N"
                        },
                        {
                            "text": "The gas released when copper reacts with dilute HNO3 is:",
                            "options": ["NO", "NO2", "N2O", "N2"],
                            "correct": "NO"
                        },
                        {
                            "text": "Which of the following transition metal ions is colorless in aqueous solution?",
                            "options": ["Sc3+", "Ti3+", "Cr3+", "Fe3+"],
                            "correct": "Sc3+"
                        },
                        {
                            "text": "The formula of rust is approximately:",
                            "options": ["Fe2O3 · xH2O", "Fe3O4", "Fe(OH)3", "FeO"],
                            "correct": "Fe2O3 · xH2O"
                        }
                    ],
                    "Physical Chemistry": [
                        {
                            "text": "The rate constant of a first-order reaction is 0.0693 min^-1. What is the half-life of the reaction?",
                            "options": ["10 min", "5 min", "100 min", "1 min"],
                            "correct": "10 min"
                        },
                        {
                            "text": "At constant temperature, if the pressure of a given mass of gas is doubled, its volume becomes:",
                            "options": ["One-half", "Double", "Four times", "Remains unchanged"],
                            "correct": "One-half"
                        },
                        {
                            "text": "Which of the following is a colligative property of a solution?",
                            "options": ["Osmotic pressure", "Boiling point", "Vapor pressure", "Freezing point"],
                            "correct": "Osmotic pressure"
                        },
                        {
                            "text": "The standard reduction potentials of three metals A, B, and C are +0.5V, -3.0V, and -1.2V respectively. The reducing power of these metals is in the order:",
                            "options": ["B > C > A", "A > C > B", "C > B > A", "A > B > C"],
                            "correct": "B > C > A"
                        },
                        {
                            "text": "The pH of a 10^-3 M NaOH solution at 25°C is:",
                            "options": ["11", "3", "7", "10"],
                            "correct": "11"
                        },
                        {
                            "text": "For a spontaneous process at all temperatures, the conditions are:",
                            "options": ["ΔH < 0, ΔS > 0", "ΔH > 0, ΔS < 0", "ΔH < 0, ΔS < 0", "ΔH > 0, ΔS > 0"],
                            "correct": "ΔH < 0, ΔS > 0"
                        },
                        {
                            "text": "The unit of rate constant for a second-order reaction is:",
                            "options": ["L mol^-1 s^-1", "s^-1", "mol L^-1 s^-1", "L² mol^-2 s^-1"],
                            "correct": "L mol^-1 s^-1"
                        },
                        {
                            "text": "Which gas will show the maximum deviation from ideal behavior at low temperature and high pressure?",
                            "options": ["NH3", "H2", "N2", "He"],
                            "correct": "NH3"
                        },
                        {
                            "text": "What is the oxidation number of sulfur in H2SO5 (Caro's acid)?",
                            "options": ["+6", "+8", "+5", "+4"],
                            "correct": "+6"
                        },
                        {
                            "text": "The value of Henry's constant KH is:",
                            "options": ["Greater for gases with lower solubility", "Greater for gases with higher solubility", "Constant for all gases", "Independent of temperature"],
                            "correct": "Greater for gases with lower solubility"
                        }
                    ]
                },
                "Mathematics": {
                    "Calculus": [
                        {
                            "text": "Find the limit as x approaches 0 of sin(5x)/x.",
                            "options": ["5", "1/5", "1", "0"],
                            "correct": "5"
                        },
                        {
                            "text": "What is the derivative of e^(x²) with respect to x?",
                            "options": ["2x * e^(x²)", "x² * e^(x²)", "e^(x²)", "2 * e^(x²)"],
                            "correct": "2x * e^(x²)"
                        },
                        {
                            "text": "The value of the integral from 0 to π/2 of sin(x) dx is:",
                            "options": ["1", "0", "π", "2"],
                            "correct": "1"
                        },
                        {
                            "text": "The slope of the tangent to the curve y = x³ - 3x + 2 at the point where x = 2 is:",
                            "options": ["9", "12", "6", "3"],
                            "correct": "9"
                        },
                        {
                            "text": "The solution of the differential equation dy/dx = y/x is:",
                            "options": ["y = Cx", "y = C/x", "y = x + C", "y² = x² + C"],
                            "correct": "y = Cx"
                        },
                        {
                            "text": "What is the derivative of sec(x) with respect to x?",
                            "options": ["sec(x)tan(x)", "sec²(x)", "tan²(x)", "-sec(x)tan(x)"],
                            "correct": "sec(x)tan(x)"
                        },
                        {
                            "text": "The area bounded by the curve y = x², the x-axis, and the lines x = 1 and x = 3 is:",
                            "options": ["26/3", "8/3", "9", "27"],
                            "correct": "26/3"
                        },
                        {
                            "text": "The maximum value of the function f(x) = x * e^-x is attained at x equals:",
                            "options": ["1", "0", "e", "-1"],
                            "correct": "1"
                        },
                        {
                            "text": "Find the limit as x approaches infinity of (x² + 5x + 3)/(3x² + 2x + 1).",
                            "options": ["1/3", "1", "3", "0"],
                            "correct": "1/3"
                        },
                        {
                            "text": "The integrating factor of the differential equation dy/dx + y/x = x² is:",
                            "options": ["x", "e^x", "1/x", "ln(x)"],
                            "correct": "x"
                        }
                    ],
                    "Algebra": [
                        {
                            "text": "If α and β are the roots of the quadratic equation x² - 5x + 6 = 0, then the value of α² + β² is:",
                            "options": ["13", "25", "12", "1"],
                            "correct": "13"
                        },
                        {
                            "text": "The sum of the infinite geometric series 1 + 1/3 + 1/9 + 1/27 + ... is:",
                            "options": ["3/2", "4/3", "2", "3"],
                            "correct": "3/2"
                        },
                        {
                            "text": "The total number of 4-digit numbers that can be formed using the digits 1, 2, 3, 4, 5 without repetition is:",
                            "options": ["120", "24", "60", "240"],
                            "correct": "120"
                        },
                        {
                            "text": "The term independent of x in the expansion of (x + 1/x)^6 is:",
                            "options": ["20", "15", "10", "6"],
                            "correct": "20"
                        },
                        {
                            "text": "If a matrix A is symmetric, then its transpose A^T is equal to:",
                            "options": ["A", "-A", "A^-1", "I"],
                            "correct": "A"
                        },
                        {
                            "text": "If the 3rd and 8th terms of an A.P. are 7 and 17 respectively, then the 14th term is:",
                            "options": ["29", "31", "27", "33"],
                            "correct": "29"
                        },
                        {
                            "text": "The value of the determinant of a 3x3 matrix whose all entries are 1 is:",
                            "options": ["0", "1", "3", "9"],
                            "correct": "0"
                        },
                        {
                            "text": "The number of subsets of a set containing 5 elements is:",
                            "options": ["32", "16", "25", "64"],
                            "correct": "32"
                        },
                        {
                            "text": "If A and B are independent events with P(A) = 0.3 and P(B) = 0.4, then P(A ∩ B) is:",
                            "options": ["0.12", "0.7", "0.1", "0.25"],
                            "correct": "0.12"
                        },
                        {
                            "text": "The coefficient of x³ in the expansion of (1 + x)^5 is:",
                            "options": ["10", "5", "20", "15"],
                            "correct": "10"
                        }
                    ],
                    "Coordinate Geometry": [
                        {
                            "text": "The distance between the parallel lines 3x + 4y - 9 = 0 and 3x + 4y + 6 = 0 is:",
                            "options": ["3 units", "5 units", "15 units", "1 unit"],
                            "correct": "3 units"
                        },
                        {
                            "text": "The equation of the circle concentric with x² + y² - 4x - 6y - 9 = 0 and passing through the origin is:",
                            "options": ["x² + y² - 4x - 6y = 0", "x² + y² - 4x - 6y + 9 = 0", "x² + y² = 0", "x² + y² - 4x - 6y + 13 = 0"],
                            "correct": "x² + y² - 4x - 6y = 0"
                        },
                        {
                            "text": "The eccentricity of the ellipse x²/16 + y²/9 = 1 is:",
                            "options": ["√7/4", "3/4", "7/16", "5/4"],
                            "correct": "√7/4"
                        },
                        {
                            "text": "The focus of the parabola y² = 12x is:",
                            "options": ["(3, 0)", "(0, 3)", "(-3, 0)", "(6, 0)"],
                            "correct": "(3, 0)"
                        },
                        {
                            "text": "The slope of the line perpendicular to the line passing through points (2, 5) and (4, 9) is:",
                            "options": ["-1/2", "2", "-2", "1/2"],
                            "correct": "-1/2"
                        },
                        {
                            "text": "The coordinates of the centroid of a triangle with vertices (1, 2), (3, 4), and (5, 6) are:",
                            "options": ["(3, 4)", "(3, 3)", "(4, 4)", "(2, 3)"],
                            "correct": "(3, 4)"
                        },
                        {
                            "text": "The equation of the tangent to the parabola y² = 8x at the point (2, 4) is:",
                            "options": ["x - y + 2 = 0", "x + y - 6 = 0", "2x - y = 0", "x - 2y + 6 = 0"],
                            "correct": "x - y + 2 = 0"
                        },
                        {
                            "text": "The length of the latus rectum of the hyperbola x²/9 - y²/16 = 1 is:",
                            "options": ["32/3", "8/3", "16/3", "64/3"],
                            "correct": "32/3"
                        },
                        {
                            "text": "The distance of the point (3, 4, 5) from the origin is:",
                            "options": ["5√2", "5", "50", "12"],
                            "correct": "5√2"
                        },
                        {
                            "text": "The angle between the lines whose direction ratios are (1, 2, 2) and (2, 2, -3) is:",
                            "options": ["90°", "0°", "45°", "60°"],
                            "correct": "90°"
                        }
                    ]
                }
            },
            "exam_neet": {
                "Physics": {
                    "Mechanics": [
                        {
                            "text": "A car travels half the distance with speed v1 and the remaining half with speed v2. The average speed of the car is:",
                            "options": ["2v1v2 / (v1 + v2)", "(v1 + v2) / 2", "v1v2 / (v1 + v2)", "√(v1v2)"],
                            "correct": "2v1v2 / (v1 + v2)"
                        },
                        {
                            "text": "A body of mass 500 g is thrown vertically upwards with speed 20 m/s. What is its potential energy at the highest point? (g = 10 m/s²)",
                            "options": ["100 J", "200 J", "50 J", "10 J"],
                            "correct": "100 J"
                        },
                        {
                            "text": "A force F = 5i + 3j - 2k N acts on a particle and displaces it from origin to r = 2i + 1j m. The work done is:",
                            "options": ["13 J", "10 J", "8 J", "15 J"],
                            "correct": "13 J"
                        },
                        {
                            "text": "If the mass of the Earth remains constant but its radius decreases by 1%, the acceleration due to gravity on its surface will:",
                            "options": ["Increase by 2%", "Decrease by 2%", "Increase by 1%", "Decrease by 1%"],
                            "correct": "Increase by 2%"
                        },
                        {
                            "text": "A light wire and a heavy wire are stretched by the same force. Which one will stretch more?",
                            "options": ["Light wire", "Heavy wire", "Both stretch equally", "Cannot be determined"],
                            "correct": "Light wire"
                        },
                        {
                            "text": "The dimensions of gravitational constant G are:",
                            "options": ["[M^-1 L³ T^-2]", "[M L² T^-2]", "[M^-2 L³ T^-1]", "[M^-1 L² T^-2]"],
                            "correct": "[M^-1 L³ T^-2]"
                        },
                        {
                            "text": "A body falls from a height of 45 m. The time taken to reach the ground is: (g = 10 m/s²)",
                            "options": ["3 s", "4.5 s", "9 s", "2 s"],
                            "correct": "3 s"
                        },
                        {
                            "text": "The work done by a conservative force along a closed path is:",
                            "options": ["Zero", "Positive", "Negative", "Infinite"],
                            "correct": "Zero"
                        },
                        {
                            "text": "If a person swings on a swing in a sitting position and then stands up, the time period of swing will:",
                            "options": ["Decrease", "Increase", "Remain same", "Become zero"],
                            "correct": "Decrease"
                        },
                        {
                            "text": "A force of 10 N acts on a body of mass 2 kg initially at rest. The velocity of the body after 4 seconds is:",
                            "options": ["20 m/s", "10 m/s", "40 m/s", "5 m/s"],
                            "correct": "20 m/s"
                        }
                    ],
                    "Optics": [
                        {
                            "text": "A convex lens of focal length 20 cm is placed in contact with a concave lens of focal length 25 cm. The power of the combination is:",
                            "options": ["+1 D", "-1 D", "+9 D", "-9 D"],
                            "correct": "+1 D"
                        },
                        {
                            "text": "The refractive index of glass is 1.5. What is the critical angle for glass-air interface?",
                            "options": ["sin^-1(2/3)", "sin^-1(3/2)", "45°", "30°"],
                            "correct": "sin^-1(2/3)"
                        },
                        {
                            "text": "An object is placed at a distance of 15 cm in front of a concave mirror of focal length 10 cm. The image is formed at:",
                            "options": ["30 cm in front of the mirror", "30 cm behind the mirror", "15 cm in front of the mirror", "60 cm behind the mirror"],
                            "correct": "30 cm in front of the mirror"
                        },
                        {
                            "text": "In Young's double slit experiment, if the distance between the slits is halved and distance of screen is doubled, the fringe width will:",
                            "options": ["Become 4 times", "Become 2 times", "Be halved", "Remain unchanged"],
                            "correct": "Become 4 times"
                        },
                        {
                            "text": "Which of the following phenomena proves the transverse nature of light?",
                            "options": ["Polarization", "Interference", "Diffraction", "Refraction"],
                            "correct": "Polarization"
                        },
                        {
                            "text": "An object is placed at the focus of a convex lens. The image is formed at:",
                            "options": ["Infinity", "Focus", "Optical center", "Double the focus"],
                            "correct": "Infinity"
                        },
                        {
                            "text": "For a normal eye, the least distance of distinct vision is:",
                            "options": ["25 cm", "25 m", "10 cm", "Infinity"],
                            "correct": "25 cm"
                        },
                        {
                            "text": "A ray of light passes from glass to water. The ray will bend:",
                            "options": ["Away from normal", "Towards normal", "Go straight", "Reflected completely"],
                            "correct": "Away from normal"
                        },
                        {
                            "text": "The phenomenon responsible for the blue color of the sky is:",
                            "options": ["Scattering of light", "Refraction of light", "Total internal reflection", "Interference of light"],
                            "correct": "Scattering of light"
                        },
                        {
                            "text": "The magnifying power of an astronomical telescope in normal adjustment is:",
                            "options": ["fo / fe", "fo * fe", "fe / fo", "fo + fe"],
                            "correct": "fo / fe"
                        }
                    ],
                    "Modern Physics": [
                        {
                            "text": "The de Broglie wavelength of an electron accelerated through a potential difference of 100 V is approximately:",
                            "options": ["0.123 nm", "1.23 nm", "12.3 nm", "0.012 nm"],
                            "correct": "0.123 nm"
                        },
                        {
                            "text": "The half-life of a radioactive substance is 10 days. The time taken for 75% of the substance to decay is:",
                            "options": ["20 days", "30 days", "15 days", "40 days"],
                            "correct": "20 days"
                        },
                        {
                            "text": "According to Bohr's model, the radius of the ground state of hydrogen atom is r0. The radius of the third orbit is:",
                            "options": ["9 r0", "3 r0", "27 r0", "r0/3"],
                            "correct": "9 r0"
                        },
                        {
                            "text": "In a photoelectric effect experiment, if the intensity of light is doubled, the photoelectric current will:",
                            "options": ["Be doubled", "Remain constant", "Be halved", "Become four times"],
                            "correct": "Be doubled"
                        },
                        {
                            "text": "The energy equivalent of 1 amu is approximately:",
                            "options": ["931.5 MeV", "931.5 keV", "1.6×10^-19 J", "9.31 MeV"],
                            "correct": "931.5 MeV"
                        },
                        {
                            "text": "When a hydrogen atom emits a photon during a transition from n=4 to n=2, the series belongs to:",
                            "options": ["Balmer series", "Lyman series", "Paschen series", "Brackett series"],
                            "correct": "Balmer series"
                        },
                        {
                            "text": "In a p-type semiconductor, the majority charge carriers are:",
                            "options": ["Holes", "Electrons", "Protons", "Neutrons"],
                            "correct": "Holes"
                        },
                        {
                            "text": "The binding energy per nucleon is maximum for the nucleus:",
                            "options": ["Fe-56", "He-4", "U-235", "O-16"],
                            "correct": "Fe-56"
                        },
                        {
                            "text": "The work function of a metal is 2.0 eV. The threshold frequency of the metal is approximately:",
                            "options": ["4.8×10^14 Hz", "4.8×10^15 Hz", "2.4×10^14 Hz", "9.6×10^14 Hz"],
                            "correct": "4.8×10^14 Hz"
                        },
                        {
                            "text": "The basic logic gate that performs inversion is:",
                            "options": ["NOT gate", "AND gate", "OR gate", "NAND gate"],
                            "correct": "NOT gate"
                        }
                    ]
                },
                "Chemistry": {
                    "Chemical Bonding": [
                        {
                            "text": "Which of the following molecules has a net dipole moment?",
                            "options": ["NF3", "BF3", "CO2", "CCl4"],
                            "correct": "NF3"
                        },
                        {
                            "text": "The hybridization of sulfur in SF6 is:",
                            "options": ["sp³d²", "sp³d", "sp³", "d²sp³"],
                            "correct": "sp³d²"
                        },
                        {
                            "text": "Which of the following compounds has the highest lattice energy?",
                            "options": ["LiF", "NaCl", "KBr", "CsI"],
                            "correct": "LiF"
                        },
                        {
                            "text": "The number of pi (π) bonds in a molecule of acetylene (C2H2) is:",
                            "options": ["2", "1", "3", "0"],
                            "correct": "2"
                        },
                        {
                            "text": "Which of the following species is paramagnetic?",
                            "options": ["O2", "N2", "CO", "CN-"],
                            "correct": "O2"
                        },
                        {
                            "text": "The molecule with zero dipole moment among these is:",
                            "options": ["CO2", "H2O", "NH3", "SO2"],
                            "correct": "CO2"
                        },
                        {
                            "text": "The correct order of bond angles in H2O, NH3, and CH4 is:",
                            "options": ["CH4 > NH3 > H2O", "H2O > NH3 > CH4", "NH3 > H2O > CH4", "CH4 > H2O > NH3"],
                            "correct": "CH4 > NH3 > H2O"
                        },
                        {
                            "text": "Which of the following contains both ionic and covalent bonds?",
                            "options": ["NaOH", "NaCl", "H2O", "CH4"],
                            "correct": "NaOH"
                        },
                        {
                            "text": "According to molecular orbital theory, which of the following is temporary/does not exist?",
                            "options": ["He2", "H2", "Li2", "O2"],
                            "correct": "He2"
                        },
                        {
                            "text": "The number of sigma (σ) and pi (π) bonds in benzene molecule is:",
                            "options": ["12 σ, 3 π", "6 σ, 3 π", "9 σ, 3 π", "12 σ, 6 π"],
                            "correct": "12 σ, 3 π"
                        }
                    ],
                    "Equilibrium": [
                        {
                            "text": "The pH of a buffer solution containing equal concentrations of a weak acid HA (pKa = 4.75) and its conjugate base A- is:",
                            "options": ["4.75", "7.00", "9.25", "5.75"],
                            "correct": "4.75"
                        },
                        {
                            "text": "For the reaction N2(g) + 3H2(g) ⇌ 2NH3(g), the relation between Kp and Kc is:",
                            "options": ["Kp = Kc(RT)^-2", "Kp = Kc(RT)^2", "Kp = Kc", "Kp = Kc(RT)^-1"],
                            "correct": "Kp = Kc(RT)^-2"
                        },
                        {
                            "text": "The solubility product (Ksp) of AgCl is 1.8×10^-10. What is its solubility in water?",
                            "options": ["1.34×10^-5 M", "1.8×10^-5 M", "1.34×10^-10 M", "9.0×10^-6 M"],
                            "correct": "1.34×10^-5 M"
                        },
                        {
                            "text": "According to Le Chatelier's principle, adding an inert gas at constant volume to a system in equilibrium will:",
                            "options": ["Have no effect on equilibrium", "Shift in direction of more moles", "Shift in direction of fewer moles", "Increase the rate constant"],
                            "correct": "Have no effect on equilibrium"
                        },
                        {
                            "text": "Which of the following acts as a Lewis acid?",
                            "options": ["BF3", "NH3", "H2O", "F-"],
                            "correct": "BF3"
                        },
                        {
                            "text": "The conjugate base of HSO4- is:",
                            "options": ["SO4^2-", "H2SO4", "SO3^2-", "H+"],
                            "correct": "SO4^2-"
                        },
                        {
                            "text": "The pH of a 10^-8 M HCl solution at 25°C is:",
                            "options": ["Slightly less than 7", "8", "6", "Slightly more than 7"],
                            "correct": "Slightly less than 7"
                        },
                        {
                            "text": "For a reversible reaction, if the reaction quotient Q is greater than K, the reaction will proceed in:",
                            "options": ["Backward direction", "Forward direction", "Both directions equally", "Will stop"],
                            "correct": "Backward direction"
                        },
                        {
                            "text": "Which of the following salt solutions is basic in nature?",
                            "options": ["CH3COONa", "NH4Cl", "NaCl", "Na2SO4"],
                            "correct": "CH3COONa"
                        },
                        {
                            "text": "The relation between solubility S and solubility product Ksp of a sparingly soluble salt AB2 is:",
                            "options": ["Ksp = 4S³", "Ksp = S²", "Ksp = 27S⁴", "Ksp = 8S³"],
                            "correct": "Ksp = 4S³"
                        }
                    ],
                    "Organic Compounds": [
                        {
                            "text": "Which of the following compounds is most reactive towards electrophilic aromatic substitution?",
                            "options": ["Phenol", "Benzene", "Nitrobenzene", "Chlorobenzene"],
                            "correct": "Phenol"
                        },
                        {
                            "text": "The conversion of cyclohexanol into cyclohexene is an example of:",
                            "options": ["Dehydration", "Dehydrogenation", "Dehydrohalogenation", "Oxidation"],
                            "correct": "Dehydration"
                        },
                        {
                            "text": "The major product formed when propene reacts with HBr in the presence of peroxides is:",
                            "options": ["1-Bromopropane", "2-Bromopropane", "1,2-Dibromopropane", "2-Bromopropene"],
                            "correct": "1-Bromopropane"
                        },
                        {
                            "text": "Which test is used to detect the presence of primary amines?",
                            "options": ["Carbylamine test", "Reimer-Tiemann test", "Fehling's test", "Biuret test"],
                            "correct": "Carbylamine test"
                        },
                        {
                            "text": "The natural polymer rubber is a polymer of:",
                            "options": ["Isoprene", "Chloroprene", "Butadiene", "Styrene"],
                            "correct": "Isoprene"
                        },
                        {
                            "text": "The IUPAC name of the compound CH2=CH-CH2-Cl is:",
                            "options": ["3-Chloroprop-1-ene", "1-Chloroprop-2-ene", "Allyl chloride", "3-Chloropropene"],
                            "correct": "3-Chloroprop-1-ene"
                        },
                        {
                            "text": "Which of the following compounds gives a silver mirror with Tollens' reagent?",
                            "options": ["Formaldehyde", "Acetone", "Benzophenone", "Diethyl ether"],
                            "correct": "Formaldehyde"
                        },
                        {
                            "text": "The test used to distinguish primary, secondary, and tertiary alcohols is:",
                            "options": ["Lucas test", "Tollens' test", "Fehling's test", "Carbylamine test"],
                            "correct": "Lucas test"
                        },
                        {
                            "text": "Which of the following compounds does not contain a carbonyl group?",
                            "options": ["Ethanol", "Acetaldehyde", "Acetone", "Acetic acid"],
                            "correct": "Ethanol"
                        },
                        {
                            "text": "The reaction of carboxylic acids with alcohols in the presence of acid catalyst is called:",
                            "options": ["Esterification", "Saponification", "Etherification", "Decarboxylation"],
                            "correct": "Esterification"
                        }
                    ]
                },
                "Biology": {
                    "Cell Biology": [
                        {
                            "text": "Which of the following cell organelles is called the 'suicide bag'?",
                            "options": ["Lysosome", "Ribosome", "Golgi body", "Centrosome"],
                            "correct": "Lysosome"
                        },
                        {
                            "text": "The fluid mosaic model of cell membrane was proposed by:",
                            "options": ["Singer and Nicolson", "Watson and Crick", "Schleiden and Schwann", "Robert Brown"],
                            "correct": "Singer and Nicolson"
                        },
                        {
                            "text": "In which stage of meiosis does crossing over occur?",
                            "options": ["Pachytene", "Leptotene", "Zygotene", "Diplotene"],
                            "correct": "Pachytene"
                        },
                        {
                            "text": "The site of aerobic respiration in eukaryotic cells is the:",
                            "options": ["Mitochondria", "Chloroplast", "Cytoplasm", "Endoplasmic Reticulum"],
                            "correct": "Mitochondria"
                        },
                        {
                            "text": "Which of the following macromolecule is most abundant in a cell after water?",
                            "options": ["Proteins", "Carbohydrates", "Lipids", "Nucleic acids"],
                            "correct": "Proteins"
                        },
                        {
                            "text": "Which of the following organelles is double membrane-bound?",
                            "options": ["Mitochondria", "Ribosome", "Lysosome", "Centrosome"],
                            "correct": "Mitochondria"
                        },
                        {
                            "text": "The non-membrane bound organelle found in both animal and plant cells is:",
                            "options": ["Ribosome", "Centrosome", "Vacuole", "Nucleolus"],
                            "correct": "Ribosome"
                        },
                        {
                            "text": "The phase of cell cycle in which DNA synthesis occurs is:",
                            "options": ["S-phase", "G1-phase", "G2-phase", "M-phase"],
                            "correct": "S-phase"
                        },
                        {
                            "text": "Which organelle is main site of lipid synthesis?",
                            "options": ["Smooth Endoplasmic Reticulum", "Rough Endoplasmic Reticulum", "Golgi apparatus", "Ribosome"],
                            "correct": "Smooth Endoplasmic Reticulum"
                        },
                        {
                            "text": "The cell wall of fungi is composed of:",
                            "options": ["Chitin", "Cellulose", "Hemicellulose", "Pectin"],
                            "correct": "Chitin"
                        }
                    ],
                    "Genetics": [
                        {
                            "text": "The phenotypic ratio of a Mendelian dihybrid cross in F2 generation is:",
                            "options": ["9:3:3:1", "3:1", "1:2:1", "9:7"],
                            "correct": "9:3:3:1"
                        },
                        {
                            "text": "Who proposed the double helical structure of DNA?",
                            "options": ["Watson and Crick", "Mendel", "Morgan", "Darwin"],
                            "correct": "Watson and Crick"
                        },
                        {
                            "text": "Which of the following genetic disorders is caused by trisomy of chromosome 21?",
                            "options": ["Down's syndrome", "Turner's syndrome", "Klinefelter's syndrome", "Sickle cell anemia"],
                            "correct": "Down's syndrome"
                        },
                        {
                            "text": "The process of translation refers to:",
                            "options": ["Protein synthesis from RNA", "RNA synthesis from DNA", "DNA replication", "RNA synthesis from protein"],
                            "correct": "Protein synthesis from RNA"
                        },
                        {
                            "text": "The term 'linkage' was coined by:",
                            "options": ["T. H. Morgan", "Gregor Mendel", "Hugo de Vries", "Sutton and Boveri"],
                            "correct": "T. H. Morgan"
                        },
                        {
                            "text": "The unit of inheritance that controls a specific trait is called a:",
                            "options": ["Gene", "Allele", "Chromosome", "Genotype"],
                            "correct": "Gene"
                        },
                        {
                            "text": "A cross between a hybrid and its homozygous recessive parent is called a:",
                            "options": ["Test cross", "Back cross", "Monohybrid cross", "Reciprocal cross"],
                            "correct": "Test cross"
                        },
                        {
                            "text": "The process of DNA duplication is called:",
                            "options": ["Replication", "Transcription", "Translation", "Translocation"],
                            "correct": "Replication"
                        },
                        {
                            "text": "Which nitrogenous base is present in RNA instead of Thymine?",
                            "options": ["Uracil", "Adenine", "Guanine", "Cytosine"],
                            "correct": "Uracil"
                        },
                        {
                            "text": "The classical experiment on pea plant (Pisum sativum) was conducted by:",
                            "options": ["Gregor Mendel", "Charles Darwin", "Thomas Morgan", "Hugo de Vries"],
                            "correct": "Gregor Mendel"
                        }
                    ],
                    "Human Physiology": [
                        {
                            "text": "Which hormone is responsible for regulating water balance in the human body?",
                            "options": ["Antidiuretic hormone (ADH)", "Insulin", "Adrenaline", "Thyroxine"],
                            "correct": "Antidiuretic hormone (ADH)"
                        },
                        {
                            "text": "The functional unit of human kidney is:",
                            "options": ["Nephron", "Neuron", "Alveolus", "Hepatic lobule"],
                            "correct": "Nephron"
                        },
                        {
                            "text": "Where is the respiratory center located in the human brain?",
                            "options": ["Medulla oblongata", "Cerebellum", "Cerebrum", "Hypothalamus"],
                            "correct": "Medulla oblongata"
                        },
                        {
                            "text": "Which of the following cells in the pancreas secrete insulin?",
                            "options": ["Beta cells", "Alpha cells", "Delta cells", "F cells"],
                            "correct": "Beta cells"
                        },
                        {
                            "text": "The main site of absorption of digested food in humans is the:",
                            "options": ["Small intestine", "Stomach", "Large intestine", "Mouth"],
                            "correct": "Small intestine"
                        },
                        {
                            "text": "Which of the following carries oxygenated blood from lungs to the heart?",
                            "options": ["Pulmonary vein", "Pulmonary artery", "Aorta", "Vena cava"],
                            "correct": "Pulmonary vein"
                        },
                        {
                            "text": "The bile juice is produced by the:",
                            "options": ["Liver", "Gall bladder", "Pancreas", "Stomach"],
                            "correct": "Liver"
                        },
                        {
                            "text": "How many vertebrae are present in the cervical region of human spine?",
                            "options": ["7", "12", "5", "9"],
                            "correct": "7"
                        },
                        {
                            "text": "The oxygen-carrying pigment in human red blood cells is:",
                            "options": ["Hemoglobin", "Myoglobin", "Hemocyanin", "Chlorocruorin"],
                            "correct": "Hemoglobin"
                        },
                        {
                            "text": "The hormone that decreases blood glucose levels is:",
                            "options": ["Insulin", "Glucagon", "Adrenaline", "Cortisol"],
                            "correct": "Insulin"
                        }
                    ]
                }
            }
        }
        
        for chapter in chapters:
            exam_id = chapter["exam_id"]
            subject_name = chapter["subject_name"]
            chapter_name = chapter["chapter_name"]
            
            questions_list = question_bank.get(exam_id, {}).get(subject_name, {}).get(chapter_name, [])
            
            for q_num, q_template in enumerate(questions_list):
                question_id = f"q_{chapter['chapter_id']}_{q_num:02d}"
                
                # Shuffle options so correct answer isn't always first
                options = q_template["options"].copy()
                random.shuffle(options)
                
                # Define a default structured explanation that feels concierge and expert
                normalized_text = q_template["text"].lower()
                explanation = {
                    "concept": "Core Syllabus Theory",
                    "formula": "Standard Relation Model",
                    "correct_reason": f"Evaluating standard conceptual systems confirms that the correct value evaluates directly to {q_template['correct']}.",
                    "common_mistake": "Neglecting system measurement boundaries or mathematical sign conventions."
                }

                if "solid sphere" in normalized_text and "rotational kinetic energy" in normalized_text:
                    explanation = {
                        "concept": "Rotational & Translational Dynamics",
                        "formula": "K_total = K_trans + K_rot = 1/2*M*v^2 + 1/2*I*w^2",
                        "correct_reason": "For a solid sphere, I = 2/5*M*R^2. Since it rolls without slipping, w = v/R, giving K_rot = 1/5*M*v^2. Total kinetic energy is K_total = 1/2*M*v^2 + 1/5*M*v^2 = 7/10*M*v^2. The ratio of rotational to total kinetic energy is (1/5) / (7/10) = 2/7.",
                        "common_mistake": "Using the wrong moment of inertia (like 2/3 for a hollow sphere) or ignoring the translational kinetic energy component in the denominator."
                    }
                elif "displacement at any time t" in normalized_text and "velocity when the acceleration is zero" in normalized_text:
                    explanation = {
                        "concept": "Differential Calculus & Kinematics",
                        "formula": "v(t) = ds/dt, a(t) = dv/dt",
                        "correct_reason": "Differentiate displacement to find velocity: v(t) = 3t² - 12t + 3. Differentiate velocity to find acceleration: a(t) = 6t - 12. Setting acceleration to zero (6t - 12 = 0) yields t = 2s. Substituting t = 2s into velocity yields v(2) = 3(2)² - 12(2) + 3 = -9 m/s.",
                        "common_mistake": "Trying to substitute t = 0 immediately or confusing the derivatives for velocity and acceleration."
                    }
                elif "static friction" in normalized_text and "rough horizontal surface" in normalized_text:
                    explanation = {
                        "concept": "Newtonian Mechanics & Friction Forces",
                        "formula": "f_s,max = u_s * N, N = m * g",
                        "correct_reason": "Normal force N = m * g = 2 * 9.8 = 19.6 N. Limiting static friction is f_s,max = 0.4 * 19.6 = 7.84 N. Since the applied horizontal force (6 N) is less than the limiting friction (7.84 N), the block remains stationary and the static friction force exactly balances the applied force (f_s = F_applied = 6 N).",
                        "common_mistake": "Assuming that the friction force is automatically the maximum limiting friction value (7.84 N) even though the block has not started moving."
                    }
                elif "moment of inertia" in normalized_text and "uniform thin rod" in normalized_text:
                    explanation = {
                        "concept": "Rotational Inertia Integration",
                        "formula": "I = ∫ x² dm",
                        "correct_reason": "Integrating infinitesimal mass elements dm = (M/L)dx from x = -L/2 to L/2 yields I = (M/L) * [x³/3] evaluated between limits, which simplifies directly to I = 1/12 * M * L².",
                        "common_mistake": "Confusing the axis position and using the moment of inertia about the end of the rod (1/3 * M * L²)."
                    }
                elif "two point charges" in normalized_text and "+3 μc" in normalized_text:
                    explanation = {
                        "concept": "Electrostatics & Coulomb's Law",
                        "formula": "F = k * |q1 * q2| / r²",
                        "correct_reason": "Initially, F1 = k * (3 * 8) / r² = 24k / r² = 40 N. After adding -5 μC to each, the new charges are q1' = -2 μC and q2' = +3 μC. The new force magnitude is F2 = k * |-2 * 3| / r² = 6k / r². Taking the ratio F2/F1 = 6/24 = 1/4, so F2 = 40 / 4 = 10 N. Since they have opposite signs, the force is attractive.",
                        "common_mistake": "Neglecting to apply the added -5 μC charge algebraically to both charges or failing to identify the change from repulsive to attractive force."
                    }
                elif "resistance r" in normalized_text and "stretched to twice" in normalized_text:
                    explanation = {
                        "concept": "Electric Resistance & Resistivity",
                        "formula": "R = p * L / A, Volume V = L * A = Constant",
                        "correct_reason": "Stretching a wire to twice its length (L' = 2L) requires halving its cross-sectional area (A' = A/2) to conserve total volume. Substituting these into the formula yields R' = p * (2L) / (A/2) = 4 * (p * L / A) = 4R.",
                        "common_mistake": "Doubling the length without halving the area, which would incorrectly yield a resistance of 2R."
                    }
                elif "bullet of mass" in normalized_text and "300 m/s" in normalized_text:
                    explanation = {
                        "concept": "Work-Energy Theorem",
                        "formula": "Work = F * s = ΔK = 1/2 * m * v²",
                        "correct_reason": "Mass m = 10 g = 0.01 kg, depth s = 10 cm = 0.1 m. The bullet's kinetic energy is 1/2 * 0.01 * 300² = 450 J. Work done by resistive force F is F * 0.1 m = 450 J, giving F = 4500 N.",
                        "common_mistake": "Failing to convert mass from grams to kilograms or penetration depth from centimeters to meters."
                    }
                elif "escape velocity" in normalized_text and "mass of the earth becomes four times" in normalized_text:
                    explanation = {
                        "concept": "Gravitation & Escape Velocity",
                        "formula": "v_e = √(2 * G * M / R)",
                        "correct_reason": "When mass M becomes 4 times (4M) and radius R becomes 2 times (2R), the new escape velocity is v_e' = √(2 * G * 4M / 2R) = √2 * √(2 * G * M / R) = √2 * v_e.",
                        "common_mistake": "Confusing escape velocity with orbital velocity or ignoring the square root relationship."
                    }
                elif "raised to a height h = r" in normalized_text:
                    explanation = {
                        "concept": "Gravitational Potential Energy",
                        "formula": "ΔU = U_final - U_initial = -GMm/r_final - (-GMm/r_initial)",
                        "correct_reason": "At the surface r_initial = R, at height h = R, r_final = 2R. Thus, ΔU = -GMm/(2R) - (-GMm/R) = 1/2 * GMm/R. Since g = GM/R², we have GM/R = gR, which gives ΔU = 1/2 * m * g * R.",
                        "common_mistake": "Using the simplified mgh formula directly, which is only valid near the Earth's surface where g is constant."
                    }
                elif "carnot cycle" in normalized_text and "227°c and 127°c" in normalized_text:
                    explanation = {
                        "concept": "Thermodynamics & Carnot Cycle",
                        "formula": "Efficiency η = 1 - T_sink / T_source = W / Q_absorbed",
                        "correct_reason": "Convert temperatures to Kelvin: T_source = 227 + 273 = 500 K, T_sink = 127 + 273 = 400 K. Efficiency η = 1 - 400/500 = 0.2 (20%). Heat absorbed Q_absorbed = 6 kcal. Work done W = η * Q_absorbed = 0.2 * 6 = 1.2 kcal.",
                        "common_mistake": "Using temperatures in Celsius instead of Kelvin, which yields incorrect efficiency."
                    }
                elif "strongest acid" in normalized_text and "cf3cooh" in normalized_text:
                    explanation = {
                        "concept": "Organic Acid-Base Chemistry",
                        "formula": "Acid Strength ∝ Conjugate Base Stability",
                        "correct_reason": "CF3COOH is the strongest acid because the highly electronegative fluorine atoms exert a powerful electron-withdrawing inductive effect (-I effect), dispersing the negative charge on the conjugate base carboxylate anion (CF3COO-) and stabilizing it.",
                        "common_mistake": "Assuming acetic acid is stronger due to hyperconjugation or neglecting fluorine's superior electron-withdrawing capabilities."
                    }
                elif "phenol with chloroform" in normalized_text and "salicylaldehyde" in normalized_text:
                    explanation = {
                        "concept": "Electrophilic Substitution named reactions",
                        "formula": "Reimer-Tiemann Synthesis",
                        "correct_reason": "The reaction of phenol with chloroform in the presence of NaOH to form salicylaldehyde is the Reimer-Tiemann reaction. It proceeds via the formation of a dichlorocarbene intermediate (:CCl2) which attacks the phenoxide ring.",
                        "common_mistake": "Confusing it with the Kolbe-Schmitt reaction, which uses CO2 instead of chloroform to form salicylic acid."
                    }
                elif "shape of xef4" in normalized_text:
                    explanation = {
                        "concept": "Valence Shell Electron Pair Repulsion (VSEPR)",
                        "formula": "Steric Number = (Valence Electrons + Monovalent Atoms - Charge) / 2",
                        "correct_reason": "Xenon has 8 valence electrons, forming 4 bond pairs with fluorine and retaining 2 lone pairs. Steric number is 6 (octahedral electron geometry). The two lone pairs position opposite to each other to minimize repulsion, yielding a square planar molecular shape.",
                        "common_mistake": "Assuming a tetrahedral shape by ignoring the two lone pairs on the central Xenon atom."
                    }
                elif "coordination number of cobalt in [co(en)3]" in normalized_text:
                    explanation = {
                        "concept": "Coordination Complexes & Ligand Denticity",
                        "formula": "Coordination Number = Number of coordinate bonds",
                        "correct_reason": "Ethylenediamine (en) is a bidentate ligand, meaning each 'en' molecule donates two electron pairs to form two coordinate bonds. With three bidentate ligands, Cobalt forms 3 * 2 = 6 coordinate bonds, giving it a coordination number of 6.",
                        "common_mistake": "Assuming the coordination number is 3 based solely on the number of ligands without considering their bidentate nature."
                    }
                elif "electronegativity among n, o, f, and cl" in normalized_text:
                    explanation = {
                        "concept": "Periodic Trends of Electronegativity",
                        "formula": "F > O > Cl > N",
                        "correct_reason": "Fluorine is the most electronegative element (~4.0), followed by oxygen (~3.44). Chlorine and Nitrogen are close, but electronegativity decreases down a group and increases across a period, making F > O > Cl > N.",
                        "common_mistake": "Placing Chlorine above Oxygen or failing to rank Fluorine as the highest."
                    }

                question = {
                    "question_id": question_id,
                    "chapter_id": chapter["chapter_id"],
                    "question_text": q_template["text"],
                    "options": options,
                    "correct_answer": q_template["correct"],
                    "difficulty": random.choice(["easy", "medium", "hard"]),
                    "explanation": explanation,
                    "created_at": datetime.utcnow()
                }
                await db["questions"].insert_one(question)
                count += 1
        
        logger.info(f"✓ Created {count} questions with high-fidelity, completely unique content")
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
        """Create exactly 175 responses and 19 quiz sessions to hit deterministic counts"""
        import uuid
        import random
        from datetime import datetime, timedelta
        
        # 1. Map chapter to subject name
        chap_map = {}
        for c in chapters:
            chap_map[c["chapter_id"]] = c["subject_name"]
            
        # 2. Fetch all questions and group by subject name
        questions_cursor = db["questions"].find({})
        all_qs = await questions_cursor.to_list(length=None)
        
        subj_qs = {
            "Mathematics": [],
            "Biology": [],
            "Chemistry": [],
            "Physics": []
        }
        for q in all_qs:
            subj_name = chap_map.get(q["chapter_id"])
            if subj_name in subj_qs:
                subj_qs[subj_name].append(q)
                
        # 3. Targets
        targets = {
            "Mathematics": {"correct": 21, "wrong": 5, "skipped": 4, "total": 30},
            "Biology":     {"correct": 13, "wrong": 4, "skipped": 2, "total": 19},
            "Chemistry":   {"correct": 49, "wrong": 19, "skipped": 14, "total": 82},
            "Physics":     {"correct": 26, "wrong": 8, "skipped": 10, "total": 44}
        }
        
        # We need exactly 105 answered responses and 30 skipped responses to be "today"
        # Since total skipped = 30, all skipped responses will be "today"
        # Out of the 145 answered (109 correct + 36 wrong), 105 will be today, and 40 will be yesterday
        answered_today_limit = 105
        answered_today_count = 0
        
        # We will create responses and bundle them into quiz sessions of size up to 10
        response_docs = []
        session_docs = []
        
        response_count = 0
        session_count = 0
        
        for subj_name, target in targets.items():
            qs_pool = subj_qs[subj_name]
            if not qs_pool:
                continue
                
            # Create a list of response outcomes: 'correct', 'wrong', 'skipped'
            outcomes = (
                ['correct'] * target["correct"] +
                ['wrong'] * target["wrong"] +
                ['skipped'] * target["skipped"]
            )
            # Shuffle outcomes to distribute them randomly across sessions
            random.shuffle(outcomes)
            
            # Chunk outcomes into sessions of size 10 (or less for the last chunk)
            chunk_size = 10
            chunks = [outcomes[i:i + chunk_size] for i in range(0, len(outcomes), chunk_size)]
            
            for chunk_idx, chunk in enumerate(chunks):
                session_id = f"sess_{uuid.uuid4().hex[:12]}"
                user = users[session_count % len(users)]
                
                # Pick a question to find a valid chapter
                sample_q = qs_pool[chunk_idx % len(qs_pool)]
                chapter_id = sample_q["chapter_id"]
                
                session_correct = 0
                session_answers = []
                
                # Determine session date based on responses
                session_latest_date = None
                
                for idx, outcome in enumerate(chunk):
                    q = qs_pool[(chunk_idx * chunk_size + idx) % len(qs_pool)]
                    
                    is_skipped = outcome == 'skipped'
                    is_correct = outcome == 'correct'
                    
                    # Choose user answer
                    if is_skipped:
                        user_answer = None
                    elif is_correct:
                        user_answer = q["correct_answer"]
                        session_correct += 1
                    else:
                        user_answer = random.choice([opt for opt in q["options"] if opt != q["correct_answer"]])
                        
                    session_answers.append(user_answer if user_answer else "")
                    
                    # Determine date
                    if is_skipped:
                        # Skipped are always today
                        resp_date = datetime.utcnow() - timedelta(minutes=random.randint(5, 120))
                    else:
                        if answered_today_count < answered_today_limit:
                            resp_date = datetime.utcnow() - timedelta(minutes=random.randint(5, 120))
                            answered_today_count += 1
                        else:
                            resp_date = datetime.utcnow() - timedelta(days=1, hours=random.randint(1, 10))
                            
                    if not session_latest_date or resp_date > session_latest_date:
                        session_latest_date = resp_date
                        
                    resp_doc = {
                        "response_id": f"resp_{uuid.uuid4().hex[:12]}",
                        "session_id": session_id,
                        "question_id": q["question_id"],
                        "user_answer": user_answer,
                        "is_correct": is_correct,
                        "is_skipped": is_skipped,
                        "question_shown_at": resp_date - timedelta(seconds=random.randint(15, 60)),
                        "answer_submitted_at": resp_date,
                        "response_duration_ms": random.randint(4000, 16000) if not is_skipped else 0
                    }
                    response_docs.append(resp_doc)
                    response_count += 1
                    
                # Create session document
                session_doc = {
                    "session_id": session_id,
                    "user_id": user["user_id"],
                    "chapter_id": chapter_id,
                    "created_at": session_latest_date - timedelta(minutes=15),
                    "started_at": session_latest_date - timedelta(minutes=15),
                    "completed_at": session_latest_date,
                    "status": "completed",
                    "total_questions": len(chunk),
                    "correct_answers": session_correct,
                    "score": int((session_correct / len(chunk)) * 100) if len(chunk) > 0 else 0,
                    "current_question_index": len(chunk),
                    "answers": session_answers
                }
                session_docs.append(session_doc)
                session_count += 1
                
        # Insert all into DB
        if response_docs:
            await db["responses"].insert_many(response_docs)
        if session_docs:
            await db["quiz_sessions"].insert_many(session_docs)
            
        logger.info(f"✓ Created {session_count} quiz sessions and {response_count} responses")
        logger.info(f"  - Answered today count: {answered_today_count}")
        return session_count
