import { AppDataSource } from '../datasource';
import { Organization, OrganizationType } from '../entities/Organization.entity';
import { District } from '../entities/District.entity';
import { School } from '../entities/School.entity';
import { Student, Gender, StudentStatus } from '../entities/student.entity';
import { User, UserType, RoleType } from '../entities/User.entity';
import { Challenge, PREDEFINED_CHALLENGES } from '../entities/challenge.entity';
import { Assessment, AssessmentStatus } from '../entities/assessment.entity';
import * as bcrypt from 'bcrypt';

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('📋 Creating organizations...');
    const org = new Organization();
    org.name = 'Ryl Education Foundation';
    org.type = OrganizationType.SCHOOL_CHAIN;
    const savedOrg = await AppDataSource.manager.save(org);
    console.log(`✅ Created organization: ${savedOrg.name}`);

    console.log('📍 Creating districts...');
    const district = new District();
    district.name = 'Pune District';
    district.state = 'Maharashtra';
    district.description = 'Pune metropolitan district';
    const savedDistrict = await AppDataSource.manager.save(district);
    console.log(`✅ Created district: ${savedDistrict.name}`);

    console.log('🏫 Creating schools...');
    const schools: School[] = [];
    const schoolNames = [
      'Modern Public School',
      'Central High School',
      'Green Valley Academy',
      'Knowledge Plus School',
    ];

    for (let i = 0; i < schoolNames.length; i++) {
      const school = new School();
      school.name = schoolNames[i];
      school.district = 'Pune';
      school.organizationId = savedOrg.id;
      school.udiseCode = `UDISE${String(i + 1).padStart(6, '0')}`;
      school.state = 'Maharashtra';
      school.city = 'Pune';
      school.principalName = `Principal ${i + 1}`;
      school.principalEmail = `principal${i + 1}@school.edu`;
      school.address = `Address ${i + 1}, Pune`;
      school.studentCount = 500 + i * 100;
      school.staffCount = 30 + i * 5;
      school.isActive = true;
      schools.push(await AppDataSource.manager.save(school));
      console.log(`✅ Created school: ${school.name}`);
    }

    console.log('👥 Creating users...');
    const users: User[] = [];

    for (let i = 0; i < schools.length; i++) {
      // Create school admin
      const admin = new User();
      admin.email = `admin${i + 1}@school.edu`;
      admin.firstName = 'Admin';
      admin.lastName = String(i + 1);
      admin.passwordHash = await bcrypt.hash('admin123', 10);
      admin.userType = UserType.SCHOOL_ADMIN;
      admin.roleType = RoleType.ADMIN;
      admin.schoolId = schools[i].id;
      admin.isActive = true;
      users.push(await AppDataSource.manager.save(admin));
      console.log(`✅ Created admin for ${schools[i].name}`);

      // Create teacher
      const teacher = new User();
      teacher.email = `teacher${i + 1}@school.edu`;
      teacher.firstName = 'Teacher';
      teacher.lastName = String(i + 1);
      teacher.passwordHash = await bcrypt.hash('teacher123', 10);
      teacher.userType = UserType.TEACHER;
      teacher.roleType = RoleType.USER;
      teacher.schoolId = schools[i].id;
      teacher.isActive = true;
      users.push(await AppDataSource.manager.save(teacher));
    }

    console.log('📚 Creating students...');
    const students: Student[] = [];
    const studentCount = 30; // Per school

    for (let i = 0; i < schools.length; i++) {
      for (let j = 0; j < studentCount; j++) {
        const student = new Student();
        student.schoolId = schools[i].id;
        student.enrollmentNumber = `STU${i + 1}${String(j + 1).padStart(4, '0')}`;
        student.firstName = `Student`;
        student.lastName = String(j + 1);
        student.dateOfBirth = new Date(2012, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        student.gender = Math.random() > 0.5 ? Gender.MALE : Gender.FEMALE;
        student.gradeLevel = Math.floor(Math.random() * 10) + 1;
        student.classSection = String.fromCharCode(65 + Math.floor(Math.random() * 3));
        student.enrollmentDate = new Date(2023, 5, 1);
        student.status = StudentStatus.ACTIVE;
        students.push(await AppDataSource.manager.save(student));
      }
      console.log(`✅ Created ${studentCount} students for ${schools[i].name}`);
    }

    console.log('🎯 Creating challenges...');
    const challenges: Challenge[] = [];
    for (const challengeData of PREDEFINED_CHALLENGES.slice(0, 5)) {
      const challenge = new Challenge();
      challenge.code = challengeData.code;
      challenge.displayName = challengeData.displayName;
      challenge.category = challengeData.category;
      challenge.description = challengeData.description;
      challenges.push(await AppDataSource.manager.save(challenge));
      console.log(`✅ Created challenge: ${challengeData.displayName}`);
    }

    console.log('📋 Creating assessments...');
    const assessments: Assessment[] = [];
    for (const school of schools) {
      const assessment = new Assessment();
      assessment.schoolId = school.id;
      assessment.cycleName = 'Term1_2024';
      assessment.description = 'Baseline assessment';
      assessment.status = AssessmentStatus.ACTIVE;
      assessment.startDate = new Date();
      assessment.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      assessments.push(await AppDataSource.manager.save(assessment));
      console.log(`✅ Created assessment for ${school.name}`);
    }

    console.log('\n✨ Database seeding completed successfully!');
    console.log(`
      📊 Summary:
      - Organizations: 1
      - Districts: 1
      - Schools: ${schools.length}
      - Users: ${users.length}
      - Students: ${students.length}
      - Challenges: ${challenges.length}
      - Assessments: ${assessments.length}
    `);

    await AppDataSource.destroy();
  } catch (error: any) {
    console.error('❌ Seeding failed:', error?.message || error);
    console.error('Stack:', error?.stack);
    process.exit(1);
  }
}

seed();
