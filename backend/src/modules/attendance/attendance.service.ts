import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student, StudentAttendance, AttendanceStatus } from 'src/database/entities';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(StudentAttendance)
    private attendanceRepository: Repository<StudentAttendance>,
  ) {}

  async getByClass(
    schoolId: string,
    gradeLevel: number,
    classSection: string,
    date: string,
  ) {
    const students = await this.studentRepository.find({
      where: { schoolId, gradeLevel, classSection },
      order: { firstName: 'ASC' },
    });

    const attendanceDate = new Date(date);
    const records = await this.attendanceRepository.find({
      where: { schoolId, attendanceDate },
    });
    const byStudentId = new Map(records.map((r) => [r.studentId, r]));

    return students.map((student) => {
      const record = byStudentId.get(student.id);
      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName || ''}`.trim(),
        rollNumber: student.enrollmentNumber,
        status:
          record?.status === AttendanceStatus.ABSENT ? 'Absent' : 'Present',
      };
    });
  }

  async bulkMark(
    schoolId: string,
    date: string,
    records: { studentId: string; status: string }[],
  ) {
    const attendanceDate = new Date(date);
    const saved = await Promise.all(
      records.map(async ({ studentId, status }) => {
        let record = await this.attendanceRepository.findOne({
          where: { studentId, attendanceDate },
        });
        if (!record) {
          record = this.attendanceRepository.create({
            studentId,
            schoolId,
            attendanceDate,
          });
        }
        record.status =
          status === 'Absent' ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT;
        return this.attendanceRepository.save(record);
      }),
    );
    return { marked: saved.length };
  }
}
