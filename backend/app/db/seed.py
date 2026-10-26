from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.department import Department
from app.models.user import User
from app.models.emission_factor import EmissionFactor
from app.core.security import get_password_hash

def seed_data(db: Session):
    # Seed Departments
    departments_to_create = [
        {"name": "Engineering", "code": "ENG"},
        {"name": "Management", "code": "MGT"},
        {"name": "Pharmacy", "code": "PHM"},
        {"name": "Architecture", "code": "ARC"},
        {"name": "Hostel", "code": "HST"}
    ]

    for dept_data in departments_to_create:
        existing_dept = db.query(Department).filter(Department.code == dept_data["code"]).first()
        if not existing_dept:
            new_dept = Department(**dept_data, description=f"Demo {dept_data['name']} department")
            db.add(new_dept)
    
    db.commit()

    # Seed Demo Users for all evaluation roles
    demo_users = [
        {"name": "System Admin", "email": "admin@example.com", "role": "ADMIN", "dept_id": None},
        {"name": "Facility Maintenance", "email": "maintenance@vesit.edu", "role": "MAINTENANCE", "dept_id": None},
        {"name": "Dr. Department Head", "email": "hod@vesit.edu", "role": "HOD", "dept_id": 1},
        {"name": "Sustainability Auditor", "email": "viewer@vesit.edu", "role": "VIEWER", "dept_id": None},
    ]

    for u_info in demo_users:
        existing_user = db.query(User).filter(User.email == u_info["email"]).first()
        if not existing_user:
            new_user = User(
                name=u_info["name"],
                email=u_info["email"],
                password_hash=get_password_hash("admin123"),
                role=u_info["role"],
                department_id=u_info["dept_id"],
                is_active=True
            )
            db.add(new_user)
    db.commit()

    # Seed Emission Factors
    existing_ef = db.query(EmissionFactor).filter(EmissionFactor.category == "Scope 2").first()
    if not existing_ef:
        ef_electricity = EmissionFactor(
            category="Scope 2",
            subcategory="Grid Electricity",
            activity_unit="kWh",
            factor_value=0.82, # 0.82 kgCO2e per kWh (example factor for India grid)
            factor_unit="kgCO2e/kWh",
            source="Central Electricity Authority (CEA)",
            region="India",
            is_active=True
        )
        db.add(ef_electricity)
        db.commit()

    print("Seed data inserted successfully.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
