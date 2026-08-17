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

    # Seed Admin User
    admin_email = "admin@example.com"
    existing_admin = db.query(User).filter(User.email == admin_email).first()
    if not existing_admin:
        admin_user = User(
            name="System Admin",
            email=admin_email,
            password_hash=get_password_hash("admin123"), 
            role="ADMIN",
            is_active=True
        )
        db.add(admin_user)
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
