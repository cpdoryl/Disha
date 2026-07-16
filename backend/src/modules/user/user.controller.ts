import { Controller, Get, Post, Patch, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UserService } from 'src/services/user.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserType } from 'src/database/entities';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('api/v2/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ryl_admin', 'school_admin')
  @ApiOperation({ summary: 'Create a user account' })
  async createUser(@Body() createUserDto: any) {
    return this.userService.createUser(createUserDto);
  }

  @Get('stats/overview')
  @Roles('ryl_admin')
  @ApiOperation({ summary: 'Organization-wide user & school stats (RYL Admin only)' })
  async getOrgOverview() {
    return this.userService.getOrgOverview();
  }

  @Get(':id')
  @Roles('ryl_admin', 'school_admin')
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiOperation({ summary: 'Get user details' })
  async getUser(@Param('id') userId: string) {
    return this.userService.getUser(userId);
  }

  @Get('school/:schoolId')
  @Roles('ryl_admin', 'school_admin')
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiOperation({ summary: 'Get users by school' })
  async getUsersBySchool(@Param('schoolId') schoolId: string) {
    return this.userService.getUsersBySchool(schoolId);
  }

  @Get()
  @Roles('ryl_admin')
  @ApiOperation({ summary: 'List all users (RYL Admin only)' })
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Patch(':id/role')
  @Roles('ryl_admin')
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiOperation({ summary: 'Assign a new role to a user (RYL Admin only)' })
  async assignRole(@Param('id') userId: string, @Body() body: { userType: UserType }) {
    return this.userService.assignRole(userId, body.userType);
  }

  @Patch(':id/status')
  @Roles('ryl_admin', 'school_admin')
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiOperation({ summary: 'Activate or deactivate a user' })
  async setActiveStatus(@Param('id') userId: string, @Body() body: { isActive: boolean }) {
    return this.userService.setActiveStatus(userId, body.isActive);
  }
}
