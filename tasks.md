# BCL Portal 2024 Implementation Tasks

## 1. Core Functionality Improvements

### Session Management & Navigation

- [ ] Implement Session Storage
  - Create session management service using localStorage/sessionStorage
  - Store form data and navigation state
  - Implement back button handling with cached data
  - Add cleanup mechanisms for session data
  - Implement automatic user counter (#12345 format) from db and blockchain

### PIN Validation & Business Logic

- [ ] PIN Format Validation
  - Implement regex validation for PIN format (A/P + specific length)
  - Create validation rules for A020591862X pattern
  - Add error messages for invalid formats
  - Hide business details for A-type PINs
  - Add PIN registration tool in navigation

### Payment System Enhancements

- [ ] Payment Flow Optimization
  - Implement auto-next after payment confirmation
  - Add pre-fill functionality for M-Pesa codes
  - Create coupon/discount system for partners
  - Add validation for payment status
  - Implement pro user login process
  - Create enterprise plan contact form

## 2. Navigation & UI Components

### Header Navigation

- [ ] Tools Dropdown
  - PIN registration
  - Forgot password
  - Renew password
  - Implement dropdown UI using ShadCN

### Affiliates Section

- [ ] Create Affiliates Dropdown
  - Cybers section
  - Universities section
  - Partners section
  - Style with Tailwind CSS

### Enterprise Contact Form

- [ ] Implement Enterprise Form
  - Company Name field
  - First Name field
  - Last Name field
  - Business Email field
  - Company Size dropdown
  - Phone Number field
  - Country/Timezone selector
  - Referral source dropdown
  - Additional Details textarea
  - Form validation and submission

## 3. Automation & Monitoring

### KRA Website Integration

- [ ] Auto-ping System
  - Create background service for website monitoring returns results in session card saying kra website traffic is okay
  - Implement auto-navigation to manufacturer details on start of sesssion
  - Add automatic login with PIN/password
  - Navigate to file returns page automatically on start of session

### Website Monitoring Always - every like 30 sec

- [ ] Status Checking always
  - Implement network activity monitoring
  - Create status checking mechanism
  - Add alerts for downtime
  - Implement retry mechanism

## 4. UI/UX Improvements

### Visual Enhancements

- [ ] File Returns UI
  - Center-align important details
  - Implement purple highlight for ping button
  - Optimize form layout for PIN and password to be in first page instead
  - Add loading states and animations

### Dynamic Elements

- [ ] Interactive Components
  - Implement auto-increasing counter for "Trusted By" in main page section from database
  - Create affiliate-based color scheme system:
    - nungereturns.com: default primary purple
    - nunge.winguapps.co.ke: #7A1253
    - Dynamically load theme based on domain
  - Design and implement error screens with toast notifications
  - Add responsive layouts with toast support

### UI Components & Notifications

- [ ] Toast Notifications System
  - Implement custom react-hot-toast configuration
  - Create themed toast styles matching affiliate colors
  - Design toast layouts for different message types:
    - Success notifications (returns filed, payment confirmed)
    - Error messages (KRA issues, validation errors)
    - Warning alerts (session timeouts, network issues)
    - Info messages (status updates, tips)
  - Add toast position configuration
  - Implement toast queuing system
  - Add custom animations and transitions

###  

- [ ] Implement Chat Widget
  - Add bottom-right floating widget
  - Integrate 11labs or Vapi for voice assistance
  - Implement chat interface
  - Add voice interaction capabilities

## 5. Database & Blockchain Integration

### Database Setup

- [ ] Supabase Integration
  - Setup Supabase project configuration
  - Create database schemas and tables
  - Implement real-time subscriptions
  - Setup row level security (RLS)
  - Configure storage buckets
  - Add data migration scripts

### Authentication & Authorization

- [ ] Clerk Integration
  - Setup Clerk with Supabase
  - Implement user authentication flows
  - Configure social login providers
  - Setup user roles and permissions
  - Implement session management
  - Add user profile management

### Blockchain Implementation

- [ ] Polygon Integration
  - Setup Polygon network connection
  - Implement smart contracts for session tracking
  - Create transparency system for session deletion
  - Add blockchain transaction monitoring

## 6. Administrative Features

### Dashboard Development

- [ ] Admin Dashboard
  - Create admin authentication system
  - Implement user management interface
  - Add analytics and reporting
  - Create session monitoring tools

## 7. Pro User Features

### Pro Dashboard Implementation

- [ ] Create Pro User Dashboard
  - Customizable dashboard layout
  - Returns filing statistics
  - PIN management interface
  - Quick actions menu
  - Analytics widgets

### Pro Returns Management

- [ ] Implement Returns Features
  - Bulk returns filing
  - Returns scheduling system
  - History and tracking
  - Status notifications
  - Auto-fill from previous returns

### Pro User Analytics

- [ ] Create Analytics System
  - Returns filing metrics
  - Success rate tracking
  - Processing time analytics
  - Cost analysis
  - Trend visualization

### Pro Subscription Management

- [ ] Implement Subscription System
  - Plan management
  - Auto-renewal handling
  - Usage tracking
  - Billing history
  - Plan upgrade/downgrade

### Pro Reports & Exports

- [ ] Create Reporting System
  - Custom report generation
  - Multiple export formats
  - Scheduled reports
  - Batch processing
  - Archive management

## Implementation Guidelines

### Version Control

- Follow semantic versioning (major.minor.patch)
- Document all changes in `aachangelog.md`
- Update `aainstructions.md` with implementation details

### UI/UX Standards

- Use Next.js for routing and page structure
- Implement Tailwind CSS for styling
- Utilize Lucide icons for consistency
- Integrate ShadCN UI components
- Ensure responsive design across all devices

### Testing Requirements

- Implement unit tests for new features
- Conduct integration testing
- Perform regression testing
- Validate backward compatibility

### Documentation

- Update technical documentation
- Create user guides
- Document API endpoints
- Maintain features matrix
