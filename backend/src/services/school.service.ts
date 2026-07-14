import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School, District, Organization, CityTier, BoardType } from 'src/database/entities';

@Injectable()
export class SchoolService {
  constructor(
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    @InjectRepository(District)
    private districtRepository: Repository<District>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  async createSchool(createSchoolDto: {
    organizationId: string;
    name: string;
    district: string;
    state: string;
    city: string;
    cityTier: CityTier;
    boardType: BoardType;
    studentCount: number;
    staffCount: number;
    udiseCode?: string;
    latitude?: number;
    longitude?: number;
    principalName?: string;
    principalPhone?: string;
    principalEmail?: string;
    website?: string;
    phone?: string;
    email?: string;
  }): Promise<School> {
    const school = this.schoolRepository.create({
      ...createSchoolDto,
      organization: { id: createSchoolDto.organizationId },
      isActive: true,
      onboardedDate: new Date(),
    });
    return this.schoolRepository.save(school);
  }

  async getSchool(schoolId: string): Promise<School | null> {
    return this.schoolRepository.findOne({
      where: { id: schoolId },
      relations: ['organization', 'assessments', 'students', 'staff'],
    });
  }

  async updateSchool(schoolId: string, updateData: Partial<School>): Promise<School | null> {
    await this.schoolRepository.update(schoolId, updateData);
    return this.getSchool(schoolId);
  }

  async getSchoolsByOrganization(organizationId: string): Promise<School[]> {
    return this.schoolRepository.find({
      where: { organization: { id: organizationId } },
      order: { name: 'ASC' },
    });
  }

  async getSchoolsByDistrict(districtId: string): Promise<School[]> {
    return this.schoolRepository.find({
      where: { district: districtId },
      order: { name: 'ASC' },
    });
  }

  async getSchoolMetrics(schoolId: string): Promise<{
    studentCount: number;
    staffCount: number;
    activeAssessments: number;
    pendingAssessments: number;
  } | null> {
    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
    });
    if (!school) return null;

    // Simplified metrics - full implementation would aggregate from multiple entities
    return {
      studentCount: school.studentCount,
      staffCount: school.staffCount,
      activeAssessments: 0, // Would query Assessment entity
      pendingAssessments: 0, // Would query Assessment entity
    };
  }

  async deactivateSchool(schoolId: string): Promise<void> {
    await this.schoolRepository.update(schoolId, { isActive: false });
  }

  async createDistrict(createDistrictDto: { name: string; state: string; districtCode?: string }): Promise<District> {
    const district = this.districtRepository.create(createDistrictDto);
    return this.districtRepository.save(district);
  }

  async getDistrict(districtId: string): Promise<District | null> {
    return this.districtRepository.findOne({
      where: { id: districtId },
    });
  }

  async getDistrictsByState(state: string): Promise<District[]> {
    return this.districtRepository.find({
      where: { state },
      order: { name: 'ASC' },
    });
  }
}
