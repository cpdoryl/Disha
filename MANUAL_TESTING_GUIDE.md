# Disha v2.0 - Complete Manual Testing Guide

**Purpose:** Comprehensive user experience testing of all features  
**Target Users:** School Admin, Teacher  
**Test Environment:** Local Development or Staging  
**Duration:** ~2-3 hours for complete testing  
**Status:** Ready to execute

---

## 📋 Quick Navigation

1. [Setup & Prerequisites](#setup--prerequisites)
2. [Test Users & Credentials](#test-users--credentials)
3. [Feature Testing Modules](#feature-testing-modules)
4. [Cross-Feature Workflows](#cross-feature-workflows)
5. [Error Handling & Edge Cases](#error-handling--edge-cases)
6. [Performance Checks](#performance-checks)
7. [Accessibility & UX](#accessibility--ux)
8. [Feedback Template](#feedback-template)

---

## 🚀 Setup & Prerequisites

### Before You Start

1. **Start the development servers:**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run start:dev
   
   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3000/api/v2
   - Health check: http://localhost:3000/health

3. **Have these ready:**
   - Notepad or spreadsheet for recording feedback
   - Test data (provided below)
   - ~30 minutes per feature tested
   - Browser DevTools open (F12) to check console for errors

### System Readiness Check

Before starting, verify:
- [ ] Frontend loads without blank page
- [ ] No red errors in browser console (F12)
- [ ] Backend API responds to health check
- [ ] Database is seeded with demo data

---

## 👤 Test Users & Credentials

### Demo Accounts (Seeded in Database)

#### School Admin Account
```
Email:    admin1@school.edu
Password: admin123
Role:     school_admin
School:   Demo School 1
Permissions: Can manage students, staff, view all reports
```

#### Teacher Account
```
Email:    teacher1@school.edu
Password: teacher123
Role:     teacher
School:   Demo School 1
Permissions: Can mark attendance, create assessments, view reports
```

#### Test Data Available
- **Students:** ~30 students in demo school (grades 9-12)
- **Staff:** ~5 teachers + admin staff
- **Classes:** Derived from student grades/sections (10-A, 10-B, 11-A, 11-B, 12-A)
- **Assessments:** Sample assessment cycles already created

---

## 🧪 Feature Testing Modules

### MODULE 1: AUTHENTICATION & LOGIN

**Goal:** Verify secure login and session management  
**Time:** ~10 minutes

#### Test 1.1: Valid Login Flow
```
Steps:
1. Navigate to http://localhost:3000
2. Enter email: admin1@school.edu
3. Enter password: admin123
4. Click "Login"

Expected Results:
✓ Login form validates input (no empty submissions)
✓ Loading spinner appears during authentication
✓ Redirects to /dashboard after successful login
✓ User name appears in navbar/sidebar
✓ No errors in browser console
✓ JWT token stored in cookies (check DevTools > Application > Cookies)
```

**Feedback Points:**
- [ ] Login form is user-friendly
- [ ] Feedback messages are clear
- [ ] No delays or freezing
- [ ] Keyboard navigation works (Tab through fields)

---

#### Test 1.2: Invalid Credentials
```
Steps:
1. Try email: admin1@school.edu
2. Try password: wrongpassword
3. Click "Login"

Expected Results:
✓ Error message appears (e.g., "Invalid credentials")
✓ User is NOT redirected to dashboard
✓ Email field retains entered value (for convenience)
✓ Password field is cleared
✓ No sensitive data in error message
```

---

#### Test 1.3: Empty Fields
```
Steps:
1. Leave email field empty
2. Click "Login"

Expected Results:
✓ Validation error appears below email field
✓ Submit is prevented
✓ Focus returns to empty field
✓ Error message is clear: "Email is required"
```

---

#### Test 1.4: Logout
```
Steps:
1. After logging in, find logout button (usually in navbar)
2. Click "Logout"

Expected Results:
✓ User is redirected to login page
✓ JWT token is removed from cookies
✓ Attempting to access /dashboard manually redirects to login
✓ Browser console has no errors
```

---

### MODULE 2: DASHBOARD HOME PAGE

**Goal:** Verify KPI cards, charts, and overall layout  
**Time:** ~15 minutes

#### Test 2.1: Page Load & Data Display
```
Steps:
1. Login as admin1@school.edu
2. You should land on /dashboard (home page)

Expected Results:
✓ Page loads within 2 seconds
✓ 4 KPI cards visible:
  - Total Students
  - Attendance Rate
  - Active Assessments
  - Staff Count
✓ All cards show numeric values (not loading spinners)
✓ KPI values make sense (attendance ~60-95%, students > 0)
✓ Chart titled "Attendance Trend" is visible below
```

**Check Console:**
- Open DevTools (F12)
- Go to Console tab
- Look for red errors (should be none)
- Check Network tab: All API calls should return 200 status

---

#### Test 2.2: Charts & Visualizations
```
Steps:
1. Scroll down on dashboard
2. Observe the "Attendance Trend" bar chart
3. Observe "Recent Activities", "Quick Actions", and "System Health" sections

Expected Results:
✓ Attendance Trend shows data from Jan-May
✓ Chart is responsive (responsive to window resize)
✓ Bars are colored (blue for students, green for attendance)
✓ X-axis shows months, Y-axis shows numbers
✓ Hovering over bars shows tooltip with exact values
✓ "Quick Actions" buttons are clickable
✓ "System Health" shows green checkmarks (API/Database/Load all healthy)
```

---

#### Test 2.3: Responsive Design
```
Steps:
1. Resize browser window to 768px width (tablet)
2. Verify layout

Expected Results:
✓ Layout reflows to single column (no horizontal scroll)
✓ Cards stack vertically
✓ Chart shrinks to fit but remains readable
✓ Touch/click targets are still large enough (>44px)
✓ Text remains legible
```

---

#### Test 2.4: Real-time Context
```
Steps:
1. Note your username in top-right corner/navbar
2. Check sidebar navigation

Expected Results:
✓ Your name is displayed (e.g., "Welcome, Admin User!")
✓ Sidebar shows role-specific menu items
  - For school_admin: Students, Staff, Classes, Attendance, Reports, Communications
  - For teacher: Classes, Attendance, Assessments, Reports, Communications
✓ Current page is highlighted in sidebar (bold or different color)
```

---

### MODULE 3: STUDENTS MANAGEMENT

**Goal:** Test CRUD operations for students  
**Time:** ~20 minutes  
**Requirements:** Login as school_admin

#### Test 3.1: View Student List
```
Steps:
1. Click "Students" in sidebar
2. Wait for page to load

Expected Results:
✓ Page loads within 2 seconds
✓ Table shows at least 20 students
✓ Columns visible: Name | Enrollment # | Class | Guardian Email | Status
✓ Data looks realistic (names, enrollment numbers like "EN-001")
✓ Status shows "active" (green badges)
✓ Pagination or "Showing X of Y" message visible
```

---

#### Test 3.2: Search Student
```
Steps:
1. Find the "Search by name or enrollment number..." field
2. Type "Raj" (if Raj Kumar is in the demo data)
3. Observe results

Expected Results:
✓ List filters instantly (no page reload)
✓ Only students with "Raj" in name appear
✓ Search is case-insensitive (works for "raj", "RAJ", "Raj")
✓ Clearing search shows all students again
✓ Search also works for enrollment numbers
```

---

#### Test 3.3: Add New Student
```
Steps:
1. Click "+ Add Student" button
2. Form appears with fields:
   - First Name
   - Last Name
   - Enrollment Number
   - Date of Birth
   - Grade (10, 11, 12, etc.)
   - Section (A, B, C, etc.)
   - Gender (Male, Female, Other)
   - Guardian Email

Fill form:
  - First Name: TestStudent
  - Last Name: Demo
  - Enrollment #: EN-TEST-001
  - DOB: 01/01/2010
  - Grade: 10
  - Section: A
  - Gender: Male
  - Guardian Email: guardian@example.com

Expected Results:
✓ Form validates in real-time:
  - First name required (red error if empty)
  - Enrollment number required
  - DOB required
  - Grade required
  - Section required
  - Gender required
✓ Email field is optional (can be left empty)
✓ Email validation works (reject invalid emails like "notanemail")
✓ Submit button is disabled until required fields filled
✓ Submit button changes to "Saving..." during request
✓ Success message appears (or toast notification)
✓ New student appears in list at top
```

---

#### Test 3.4: Form Validation Errors
```
Steps:
1. Click "+ Add Student" again
2. Try to submit with empty form

Expected Results:
✓ Multiple validation errors appear:
  - "First name required"
  - "Enrollment number required"
  - etc.
✓ Errors clear as you type
✓ Submit remains disabled
✓ Form doesn't submit with empty required fields
✓ Invalid email shows error: "Invalid email"
```

---

#### Test 3.5: Close Add Form
```
Steps:
1. Form open, click "Cancel" button

Expected Results:
✓ Form closes
✓ No data is saved
✓ Form clears for next use
✓ "+ Add Student" button returns
```

---

#### Test 3.6: Student Details
```
Steps:
1. Click on a student name or row
2. If modal/detail view opens, check it

Expected Results:
✓ Student details display
✓ All fields show (first name, grade, class, guardian email)
✓ No edit/delete UI yet (documented as future feature)
```

---

### MODULE 4: STAFF MANAGEMENT

**Goal:** Test staff CRUD and filtering  
**Time:** ~15 minutes  
**Requirements:** Login as school_admin

#### Test 4.1: View Staff List
```
Steps:
1. Click "Staff" in sidebar
2. Wait for load

Expected Results:
✓ Table shows staff members
✓ Columns: Name | Employee ID | Position | Subject | Status | Action
✓ Positions shown: Principal, Vice Principal, Teacher, Counsellor, Admin Staff
✓ Status shows employment status (Active, etc.)
✓ Subject field visible for teachers
✓ "View" link in Action column
```

---

#### Test 4.2: Filter Staff by Position
```
Steps:
1. Find the "All Positions" dropdown
2. Click it and select "Teacher"
3. Observe list

Expected Results:
✓ List filters to show only teachers
✓ Filter updates instantly
✓ Other position dropdowns (Principal, Counsellor) are hidden
✓ Selecting "All Positions" shows everyone again
```

---

#### Test 4.3: Search Staff
```
Steps:
1. Find search field
2. Type "Priya" (if Priya is in data)

Expected Results:
✓ Filters staff by name in real-time
✓ Search works across all positions
✓ Combining search + position filter works together
```

---

#### Test 4.4: Add Staff Member
```
Steps:
1. Click "+ Add Staff" button
2. Fill form:
   - Employee ID: EMP-TEST-001
   - First Name: TestTeacher
   - Last Name: Demo
   - Position: Teacher
   - Subject Taught: Mathematics
   - Grade Level: 10
   - Start Date: 01/01/2024
3. Click "Add Staff Member"

Expected Results:
✓ Form validates required fields (Employee ID, First Name, Position, Start Date)
✓ Subject and Grade are optional for non-teachers
✓ Success message or toast appears
✓ New staff appears in list
✓ Form clears for next entry
```

---

#### Test 4.5: View Staff Details Modal
```
Steps:
1. Click "View" link next to any staff member

Expected Results:
✓ Modal opens showing:
  - Name and position
  - Employee ID
  - Subject (if teacher)
  - Grade level
  - Start date
  - Employment status
✓ Modal has close button (X) in top right
✓ Clicking outside modal closes it (or click X)
```

---

### MODULE 5: ATTENDANCE MARKING

**Goal:** Test attendance tracking and bulk marking  
**Time:** ~20 minutes  
**Requirements:** Login as teacher or school_admin

#### Test 5.1: View Attendance Page
```
Steps:
1. Click "Attendance" in sidebar
2. Wait for page to load

Expected Results:
✓ Page loads
✓ Shows options to select:
  - Class (Grade-Section, e.g., "10-A")
  - Date (today's date by default)
✓ Student list appears with attendance status
✓ Each student has status indicator (Present/Absent/Leave)
```

---

#### Test 5.2: Mark Attendance for Single Student
```
Steps:
1. Select a class (e.g., "10-A")
2. Select a date
3. For first student, click status button to change attendance

Expected Results:
✓ Status cycles through: Present → Absent → Leave → Present
✓ Status color changes (green=present, red=absent, yellow=leave)
✓ Button shows clear labels
```

---

#### Test 5.3: Bulk Mark Attendance
```
Steps:
1. Select class and date
2. Look for "Mark All Present" or bulk action buttons
3. Click to mark entire class present

Expected Results:
✓ All students instantly show "Present" status
✓ Visual feedback confirms bulk action
✓ Individual students can still be changed after bulk action
```

---

#### Test 5.4: Save Attendance
```
Steps:
1. Mark various students (Present, Absent, Leave)
2. Click "Save Attendance" or Submit button

Expected Results:
✓ Loading indicator appears during save
✓ Success message: "Attendance saved successfully"
✓ No data is lost
✓ Page remains on attendance view (doesn't redirect)
✓ Data persists if you refresh page
```

---

#### Test 5.5: Different Date Attendance
```
Steps:
1. Change the date picker to yesterday
2. Mark attendance for yesterday

Expected Results:
✓ Can mark attendance for past dates
✓ Can change dates without losing current data
✓ Each date has separate attendance record
✓ Switching dates doesn't auto-save
```

---

### MODULE 6: CLASSES MANAGEMENT

**Goal:** Test class viewing (read-only)  
**Time:** ~10 minutes

#### Test 6.1: View Classes
```
Steps:
1. Click "Classes" in sidebar
2. Wait for load

Expected Results:
✓ Shows list of classes
✓ Classes are derived from student data
  - Example: "Grade 10 Section A" with X students
✓ Shows student count per class
✓ Classes grouped by grade level
✓ Read-only (no edit/delete buttons) - as documented
```

---

#### Test 6.2: Class Details
```
Steps:
1. Click on a class

Expected Results:
✓ Shows students in that class
✓ Shows class teacher (if available)
✓ Shows total enrollment
✓ No create/edit UI (documented as future)
```

---

### MODULE 7: ASSESSMENTS

**Goal:** Test assessment cycle creation and management  
**Time:** ~20 minutes  
**Requirements:** Login as teacher or school_admin

#### Test 7.1: View Assessments
```
Steps:
1. Click "Assessments" in sidebar
2. Wait for load

Expected Results:
✓ Shows list of assessment cycles
✓ Columns: Assessment Name | Type | Status | Date Range | Students
✓ Status shows (Active, Completed, Pending)
✓ Example assessments visible from demo data
```

---

#### Test 7.2: Create Assessment Cycle
```
Steps:
1. Click "+ Create Assessment" button
2. Fill form:
   - Assessment Name: Midterm Exam 2024
   - Type: Diagnostic Assessment (if dropdown)
   - Start Date: 2026-07-25
   - End Date: 2026-08-15
   - Status: Active

Expected Results:
✓ Form validates required fields
✓ End date must be after start date
✓ Name field required
✓ Date validation works
✓ Submit button shows "Creating..." while saving
✓ Success message appears
✓ New assessment appears in list
```

---

#### Test 7.3: Assessment Details
```
Steps:
1. Click on created assessment

Expected Results:
✓ Shows assessment details
✓ Shows date range
✓ Shows student list who took assessment
✓ If responses exist, shows submission status
✓ Note: Question authoring/response viewing is API-only (documented)
```

---

#### Test 7.4: Filter Assessments
```
Steps:
1. Look for filter by Status (Active, Completed, etc.)
2. Select different statuses

Expected Results:
✓ List filters by status
✓ Count updates accordingly
```

---

### MODULE 8: REPORTS & ANALYTICS

**Goal:** Test data visualization and analytics  
**Time:** ~20 minutes

#### Test 8.1: Access Reports Page
```
Steps:
1. Click "Reports" in sidebar
2. Wait for page to load

Expected Results:
✓ Page loads within 3 seconds
✓ Shows 4 KPI cards at top:
  - Average Attendance
  - Average Performance
  - Total Students
  - Assessments Completed
✓ Each card shows percentage or count
✓ Cards show trend (↑ or ↓ from last month)
```

---

#### Test 8.2: Attendance Chart
```
Steps:
1. Scroll to "Attendance by Class" chart

Expected Results:
✓ Bar chart shows attendance % by class
✓ X-axis: Class names (10-A, 10-B, 11-A, etc.)
✓ Y-axis: Percentage (0-100%)
✓ Bars are colored (blue)
✓ Hovering over bar shows exact percentage in tooltip
✓ Chart is responsive to window resize
```

---

#### Test 8.3: Performance Distribution Chart
```
Steps:
1. Scroll to "Performance Distribution" pie chart

Expected Results:
✓ Pie chart shows distribution:
  - Excellent (green)
  - Good (blue)
  - Average (orange)
  - Poor (red)
✓ Each slice shows percentage and label
✓ Hovering over slice highlights it and shows tooltip
✓ Legend shows color mapping
```

---

#### Test 8.4: Performance Trend Chart
```
Steps:
1. Scroll to "Performance Trend" line chart

Expected Results:
✓ Line chart shows two lines:
  - Average Score (green)
  - Total Submitted (blue)
✓ X-axis shows weeks (Week 1-5)
✓ Y-axis shows numeric values
✓ Both lines are visible and distinguishable
✓ Legend shows which line is which
✓ Hovering shows exact values for both metrics
```

---

#### Test 8.5: Top Performers Table
```
Steps:
1. Scroll to "Top Performers" section

Expected Results:
✓ Table shows student names and subject scores
✓ Columns: Student | Math | English | Science | History | Average
✓ Average column auto-calculated and color-coded:
  - ≥90: Green
  - ≥80: Blue  
  - <80: Yellow
✓ Rows alternate colors for readability
✓ All data displays correctly
```

---

#### Test 8.6: Export & Action Buttons
```
Steps:
1. Scroll to bottom of Reports page
2. Find "Export Report", "Email Report", "Schedule Report" buttons

Expected Results:
✓ Buttons are visible and styled
✓ Buttons have clear labels
✓ Clicking buttons shows appropriate UI (download, email form, etc.)
✓ Note: Full functionality may be placeholder for pilot
```

---

### MODULE 9: COMMUNICATIONS

**Goal:** Test messaging and announcements  
**Time:** ~15 minutes

#### Test 9.1: Access Communications Hub
```
Steps:
1. Click "Communications" in sidebar

Expected Results:
✓ Shows tabs: Announcements | Messages | Send Message
✓ Tab switching works (click each tab)
✓ Active tab is highlighted
✓ Content loads for each tab
```

---

#### Test 9.2: View Announcements
```
Steps:
1. Click "Announcements" tab

Expected Results:
✓ Shows list of announcements
✓ Each shows: Title | Author | Date | Content preview
✓ Announcements are timestamped
✓ Most recent appear first
```

---

#### Test 9.3: Send Message
```
Steps:
1. Click "Send Message" tab
2. Fill form:
   - To: Select teacher or all staff
   - Subject: Test Message
   - Message: This is a test message
3. Click "Send"

Expected Results:
✓ Form validates required fields
✓ Message field accepts text
✓ "To" dropdown allows selection
✓ Submit button shows "Sending..." during request
✓ Success message appears
✓ Message is sent (visible in Messages tab for recipient)
```

---

### MODULE 10: SIDEBAR NAVIGATION

**Goal:** Test navigation and menu consistency  
**Time:** ~10 minutes

#### Test 10.1: Menu Items Display
```
Steps:
1. Observe sidebar menu

Expected Results:
✓ For school_admin, menu shows:
  - Dashboard (home)
  - Students
  - Staff
  - Classes
  - Attendance
  - Assessments
  - Reports
  - Communications
✓ For teacher, menu shows:
  - Dashboard (home)
  - Classes
  - Attendance
  - Assessments
  - Reports
  - Communications
```

---

#### Test 10.2: Active Menu Highlighting
```
Steps:
1. Click different menu items
2. Observe current page highlighting

Expected Results:
✓ Current page is highlighted (bold, color, or other indicator)
✓ Highlighting updates when navigating
✓ Breadcrumb or page title shows current location
```

---

#### Test 10.3: Menu Responsiveness
```
Steps:
1. Resize window to mobile size (< 640px)
2. Observe sidebar behavior

Expected Results:
✓ Sidebar collapses or becomes hamburger menu
✓ Mobile menu icon (☰) appears in top left
✓ Clicking menu icon toggles sidebar
✓ Menu items still accessible
✓ Page content adjusts to sidebar state
```

---

### MODULE 11: NAVBAR & USER PROFILE

**Goal:** Test top navigation and user account features  
**Time:** ~10 minutes

#### Test 11.1: Navbar Display
```
Steps:
1. Look at top of page

Expected Results:
✓ Navbar shows:
  - App logo/name (Disha)
  - Breadcrumb or page title in center
  - User profile section on right
✓ Navbar is visible on all pages
✓ Navbar background color consistent
```

---

#### Test 11.2: User Profile Menu
```
Steps:
1. Click on user profile area (name or avatar in top right)

Expected Results:
✓ Dropdown menu appears with options:
  - View Profile
  - Settings (if available)
  - Logout
✓ Menu is styled and readable
✓ Options are clickable
```

---

#### Test 11.3: Logout Flow
```
Steps:
1. Click "Logout" from profile menu

Expected Results:
✓ User is logged out
✓ Redirected to login page
✓ Session token is cleared
✓ Cannot access /dashboard without re-login
```

---

## 🔄 Cross-Feature Workflows

### WORKFLOW 1: Complete Student Onboarding
**Time:** ~15 minutes

```
Steps:
1. Login as school_admin
2. Navigate to Students
3. Add a new student with test data
4. Go to Attendance
5. Select a class with that student
6. Mark the student present
7. Save attendance
8. Go to Reports
9. Verify student appears in "Total Students" count
10. Verify attendance impact on "Average Attendance" KPI

Expected Results:
✓ Data flows correctly across all modules
✓ New student visible in attendance
✓ Attendance recorded without errors
✓ Reports update to reflect new data
✓ No data inconsistencies between pages
```

---

### WORKFLOW 2: Teacher's Daily Routine
**Time:** ~20 minutes

```
Steps:
1. Login as teacher1@school.edu
2. Click Dashboard - verify you see home page
3. Click Classes - view your classes
4. Click Attendance - mark today's attendance for a class
5. Save attendance successfully
6. Click Assessments - view available assessments
7. Click Reports - view performance data
8. Click Communications - send a message to school admin
9. Logout

Expected Results:
✓ All teacher-specific pages work
✓ Teacher cannot see "Students" or "Staff" menu items (permission)
✓ Attendance saving works
✓ Data is consistently displayed across pages
✓ No 403/permission errors
✓ Teacher feels workflow is smooth and logical
```

---

### WORKFLOW 3: Admin Quick Actions
**Time:** ~15 minutes

```
Steps:
1. Login as admin1@school.edu
2. From Dashboard, click "Quick Actions" buttons:
   - "Mark Attendance" → Should navigate to Attendance page
   - "Create Assessment" → Should open Assessment form or navigate
   - "Send Notification" → Should open Communications
3. Verify each action works as expected

Expected Results:
✓ Quick action buttons are functional
✓ They navigate to correct pages or open forms
✓ This saves time vs. using sidebar navigation
```

---

## ⚠️ Error Handling & Edge Cases

### Test Case 1: Network Error Simulation
```
Steps:
1. Open DevTools (F12)
2. Go to Network tab
3. Select "Offline" mode
4. Try to load a page or submit a form

Expected Results:
✓ User sees appropriate error message
✓ Message is clear (not technical jargon)
✓ Offline indicator visible
✓ Retry option available
✓ Page doesn't crash or freeze
```

---

### Test Case 2: Slow Network Simulation
```
Steps:
1. Open DevTools (F12)
2. Go to Network tab
3. Select "Slow 3G" throttling
4. Load Students page

Expected Results:
✓ Loading spinner appears
✓ Page doesn't appear frozen
✓ User knows something is loading
✓ Data loads and displays correctly after 5-10 seconds
✓ No timeout errors
```

---

### Test Case 3: Missing Data
```
Steps:
1. Go to Students page
2. If a student has no guardian email, verify display

Expected Results:
✓ Missing fields show "—" or "N/A"
✓ Page doesn't break
✓ Other data still displays correctly
✓ User understands field is empty (not an error)
```

---

### Test Case 4: Concurrent User Actions
```
Steps:
1. Open two browser windows (admin1@school.edu in both)
2. Window A: Add a student named "Student A"
3. Window B: Refresh Students page
4. Verify Student A appears in Window B

Expected Results:
✓ Real-time sync works across sessions
✓ New data is visible without page refresh
✓ No stale data issues
```

---

### Test Case 5: Form Resubmission
```
Steps:
1. Add a student successfully
2. Hit browser back button
3. Click "Add Student" again
4. Form should be empty (not showing previous submission)

Expected Results:
✓ Form is cleared after successful submission
✓ Previous data doesn't appear
✓ No duplicate submissions on page refresh
```

---

### Test Case 6: Long Names & Special Characters
```
Steps:
1. Add a student with name: "José María García-López"
2. Add enrollment number: "EN-2024-01-A"
3. Save successfully

Expected Results:
✓ Special characters display correctly (not garbled)
✓ Name appears correctly in list and reports
✓ No encoding issues in database
✓ Unicode characters supported
```

---

### Test Case 7: Large Data Sets
```
Steps:
1. Go to Students page
2. System has 1000+ students (if available)
3. Search for a student
4. Change pages/scroll

Expected Results:
✓ Page handles large data gracefully
✓ Search still works and is fast
✓ Pagination or infinite scroll works
✓ No performance degradation
✓ Data loads incrementally if lazy-loaded
```

---

## 📊 Performance Checks

### Check 1: Page Load Times
```
Measure these using DevTools (F12 > Network > Reload):

Expected times:
✓ Login page: <1 second
✓ Dashboard: <2 seconds
✓ Students/Staff: <2 seconds
✓ Reports with charts: <3 seconds
✓ Any other page: <2 seconds

Record actual times:
- Login: _____ seconds
- Dashboard: _____ seconds
- Students: _____ seconds
- Reports: _____ seconds
- Attendance: _____ seconds
```

---

### Check 2: First Interaction Responsiveness
```
Steps:
1. Load Dashboard
2. Click "Students" link
3. Measure time from click to page ready

Expected Results:
✓ Navigation response: <500ms
✓ Page ready: <2 seconds total
✓ No lag or stuttering
✓ Smooth transitions
```

---

### Check 3: Form Submission Speed
```
Steps:
1. Fill out "Add Student" form
2. Click submit
3. Measure time from click to success message

Expected Results:
✓ <1 second on local network
✓ <2 seconds on slow network
✓ Loading indicator visible immediately
✓ No form freezing
```

---

### Check 4: Chart Rendering
```
Steps:
1. Go to Reports page
2. Observe chart rendering

Expected Results:
✓ Charts appear within 2 seconds
✓ Charts render smoothly (no flickering)
✓ Responsive to window resize without lag
✓ Hover interactions instant
```

---

### Check 5: Search Performance
```
Steps:
1. Go to Students page (1000+ students)
2. Start typing in search
3. Each character typed, list filters

Expected Results:
✓ Search results update instantly
✓ No lag between typing and filtering
✓ Responsive on all browsers
✓ CPU/memory usage reasonable (check Task Manager)
```

---

## ♿ Accessibility & UX

### Check 1: Keyboard Navigation
```
Steps:
1. Go to login page
2. Press Tab repeatedly
3. Navigate through form without mouse

Expected Results:
✓ Tab moves through fields in logical order
✓ Focus visible on each field (blue outline)
✓ Enter/Space activates buttons
✓ Can submit form with keyboard only
✓ Tab focus never gets stuck
```

---

### Check 2: Color Contrast
```
Steps:
1. Open DevTools
2. Use Color Contrast Analyzer (or browser extension)
3. Check text readability

Expected Results:
✓ Text has sufficient contrast with background
✓ Green/red color-blind users can distinguish status
✓ No important info conveyed by color alone
✓ Error messages also have text (not just red color)
```

---

### Check 3: Form Labels & Errors
```
Steps:
1. Go to form (Add Student)
2. Leave required field empty
3. Submit

Expected Results:
✓ Error message appears
✓ Error message is associated with field
✓ Screen readers can announce error
✓ Color + icon + text used for error (not just red)
✓ Label text is clearly linked to input field
```

---

### Check 4: Mobile Responsiveness
```
Steps:
1. Open DevTools (F12)
2. Click device toolbar icon (toggle device mode)
3. Select iPhone 12 (375px)
4. Test each page

Expected Results:
✓ No horizontal scroll
✓ Text is readable (not tiny)
✓ Buttons clickable (>44px touch target)
✓ Forms stack vertically
✓ Images scale appropriately
✓ Sidebar becomes hamburger menu
✓ All features accessible on mobile
```

---

### Check 5: Browser Compatibility
```
Test in these browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

For each, verify:
✓ No console errors
✓ Layout correct
✓ All features work
✓ Performance acceptable
```

---

## 📝 Feedback Template

Use this template to record your testing feedback:

```
=== FEATURE TEST REPORT ===

Feature: _________________________________
Tested by: ________________________________
Date: ____________________________________
Browser: _________________________________

FUNCTIONALITY
[✓] Works as designed: YES / NO
Description: _____________________________

[✓] Validation works: YES / NO
Issues: ___________________________________

[✓] Error handling: YES / NO / N/A
Issues: ___________________________________

PERFORMANCE
[✓] Load time acceptable: YES / NO
Actual time: ______________________________

[✓] No console errors: YES / NO
Errors: ___________________________________

[✓] Responsive: YES / NO
Mobile tested: YES / NO / N/A

UX & DESIGN
[✓] Intuitive to use: YES / NO
Suggestions: _______________________________

[✓] Consistent styling: YES / NO
Issues: ___________________________________

[✓] Clear feedback: YES / NO
Examples: _________________________________

BUGS / ISSUES FOUND
1. Title: _________________________________
   Severity: LOW / MEDIUM / CRITICAL
   Steps to reproduce: _____________________
   
2. Title: _________________________________
   Severity: LOW / MEDIUM / CRITICAL
   Steps to reproduce: _____________________

POSITIVE FEEDBACK
- Feature was: _____________________________
- I liked: _________________________________

SUGGESTIONS FOR IMPROVEMENT
- Consider: ________________________________
- Could improve: ___________________________

OVERALL RATING
Functionality: ⭐⭐⭐⭐⭐ (1-5)
User Experience: ⭐⭐⭐⭐⭐ (1-5)
Performance: ⭐⭐⭐⭐⭐ (1-5)
```

---

## 🎯 Testing Checklist

Print this checklist and mark off as you go:

### Authentication
- [ ] Valid login works
- [ ] Invalid credentials rejected
- [ ] Empty fields validated
- [ ] Logout works
- [ ] Session persists on refresh
- [ ] Unauthorized access redirected

### Dashboard
- [ ] Page loads within 2 seconds
- [ ] All 4 KPI cards display
- [ ] Charts render correctly
- [ ] Numbers make sense
- [ ] Responsive design works
- [ ] No console errors

### Students
- [ ] List loads with all students
- [ ] Search filters correctly
- [ ] Pagination works (if applicable)
- [ ] Add student form works
- [ ] Form validation works
- [ ] New student appears in list
- [ ] Details modal works

### Staff
- [ ] List loads with all staff
- [ ] Filter by position works
- [ ] Search works
- [ ] Add staff form works
- [ ] Details modal works

### Attendance
- [ ] View attendance options
- [ ] Select class and date works
- [ ] Mark individual attendance works
- [ ] Bulk mark works
- [ ] Save attendance works
- [ ] Switching dates works

### Classes
- [ ] List shows derived classes
- [ ] Student count correct
- [ ] Click to view details works
- [ ] Read-only (no edit/delete)

### Assessments
- [ ] View assessments list
- [ ] Create assessment works
- [ ] Form validation works
- [ ] Assessment appears in list
- [ ] View details works

### Reports
- [ ] Page loads
- [ ] KPI cards display
- [ ] All charts visible
- [ ] Charts responsive
- [ ] Hover tooltips work
- [ ] Export buttons visible

### Communications
- [ ] Tabs switch
- [ ] Announcements display
- [ ] Messages display
- [ ] Send message works

### Navigation
- [ ] Sidebar shows correct items
- [ ] Active page highlighted
- [ ] Menu responsive on mobile
- [ ] All pages accessible

### User Experience
- [ ] No console errors anywhere
- [ ] Keyboard navigation works
- [ ] Mobile responsive
- [ ] Fast load times
- [ ] Intuitive workflow
- [ ] Clear error messages

---

## 📋 Summary Feedback Form

After completing all tests, fill this out:

```
TESTING SUMMARY
═══════════════════════════════════════════

Total Features Tested: ______ / 11
Critical Issues Found: ______
Blocker Issues: YES / NO

Overall Assessment:
[  ] Ready for pilot (minor issues only)
[  ] Needs fixes (some blockers)
[  ] Not ready (critical issues)

Most Positive Aspects:
1. ___________________________________
2. ___________________________________
3. ___________________________________

Top Issues to Fix:
1. ___________________________________
2. ___________________________________
3. ___________________________________

Confidence Level for Pilot:
⭐⭐⭐⭐⭐ (1-5 stars)

Estimated Training Time for Users:
- School Admin: _____ minutes
- Teacher: _____ minutes

Recommendations:
_______________________________________
_______________________________________

Testing Date Completed: ________________
Tester Name: _________________________
```

---

## 🚀 After Testing: Next Steps

1. **Document all bugs** with severity levels
2. **Prioritize fixes** (critical first)
3. **Re-test** fixed features
4. **Approve for pilot** once critical issues resolved
5. **Share feedback** with development team
6. **Plan training** based on user experience observations

---

## 📞 Support

If you encounter critical issues during testing:
1. Note exact steps to reproduce
2. Check browser console (F12) for errors
3. Note the API response (Network tab)
4. File as GitHub issue with screenshot

---

**Good luck with your testing! This thorough approach will help ensure a successful pilot launch.** 🎉
