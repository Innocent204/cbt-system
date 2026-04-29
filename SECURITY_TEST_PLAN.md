# CBT System - Proctoring & Security Testing Plan

## Test Environment Setup
- Backend: Django REST Framework
- Frontend: React with TypeScript
- Database: PostgreSQL (or SQLite for testing)
- Test Framework: pytest

## 1. Device/Session Locking Tests

### Test 1.1: Device Fingerprint Generation
**Objective:** Verify device fingerprints are generated consistently for the same device
**Steps:**
1. Send request from Device A (same browser, IP, user agent)
2. Generate device fingerprint
3. Verify fingerprint is 64-character SHA256 hash
4. Repeat request - verify same fingerprint
5. Change user agent - verify different fingerprint

**Expected Result:**
- Fingerprint is unique per device configuration
- Same device produces same fingerprint
- Different device produces different fingerprint

### Test 1.2: Device Lock on Exam Start
**Objective:** Verify exam attempts are locked to the starting device
**Steps:**
1. Start exam attempt from Device A
2. Verify `is_locked = True` and `device_fingerprint` is set
3. Try to access exam from Device B (different fingerprint)
4. Verify access is denied with error "Exam locked to different device"

**Expected Result:**
- Exam locked to starting device
- Access denied from different devices

### Test 1.3: Session Token Validation
**Objective:** Verify session tokens prevent session hijacking
**Steps:**
1. Start exam attempt - receive session token
2. Submit exam with valid session token - should succeed
3. Submit exam with invalid session token - should fail
4. Submit exam from different device with valid token - should fail (device mismatch)

**Expected Result:**
- Valid session token allows operations
- Invalid token rejected
- Device mismatch rejected even with valid token

### Test 1.4: Multiple Device Detection
**Objective:** Detect when user accesses from multiple devices simultaneously
**Steps:**
1. Start exam attempt from Device A
2. Try to start same exam from Device B while attempt is in progress
3. Verify error "Multiple devices detected"

**Expected Result:**
- Multiple device detection works
- Prevents concurrent exam sessions

## 2. Tab-Switch Detection Tests

### Test 2.1: Tab Switch Logging
**Objective:** Verify tab switches are logged during exam
**Steps:**
1. Start exam attempt
2. Trigger tab switch event (switch to different tab)
3. Call `/attempts/{id}/log-tab-switch/` endpoint
4. Verify `tab_switch_count` increments
5. Verify AuditLog entry created with action='tab_switch'

**Expected Result:**
- Tab switch count increases
- Security event logged

### Test 2.2: Excessive Tab Switch Detection
**Objective:** Verify excessive tab switches trigger security violations
**Steps:**
1. Start exam attempt
2. Trigger 6+ tab switches
3. Verify security violation added to `security_violations` array
4. Verify severity increases to 'high' after 3+ switches

**Expected Result:**
- Excessive switches logged as violations
- Severity escalates appropriately

### Test 2.3: Frontend Tab Switch Detection
**Objective:** Verify frontend detects tab switches via visibility API
**Steps:**
1. Open exam interface
2. Switch browser tab
3. Verify `useHeartbeat` hook detects visibility change
4. Verify heartbeat status changes to 'suspended'

**Expected Result:**
- Frontend detects tab switches
- Heartbeat status updates accordingly

## 3. Suspicious Behavior Scoring Tests

### Test 3.1: Mouse Pattern Analysis
**Objective:** Verify mouse movement patterns are analyzed
**Steps:**
1. Start exam attempt
2. Simulate various mouse patterns:
   - Normal human-like movement
   - Unnatural consistency (bot-like)
   - Excessive speed
   - Minimal movement
3. Call `BehaviorAnalyzer.analyze_mouse_patterns()`
4. Verify scores calculated correctly
5. Verify patterns detected (e.g., 'unnatural_consistency', 'excessive_speed')

**Expected Result:**
- Suspicious patterns detected
- Scores calculated (0.0 to 1.0)
- Risk levels assigned correctly

### Test 3.2: Keystroke Pattern Analysis
**Objective:** Verify keystroke timing patterns are analyzed
**Steps:**
1. Start exam attempt
2. Simulate various typing patterns:
   - Normal human typing
   - Perfectly consistent (bot-like)
   - Superhuman speed
   - Burst typing (copy-paste)
3. Call `BehaviorAnalyzer.analyze_keystroke_patterns()`
4. Verify scores calculated correctly
5. Verify patterns detected

**Expected Result:**
- Suspicious typing patterns detected
- Appropriate scoring applied

### Test 3.3: Face Detection Pattern Analysis
**Objective:** Verify face detection patterns are analyzed
**Steps:**
1. Start exam attempt with webcam monitoring
2. Simulate face detection events:
   - Normal single face
   - No face detected
   - Multiple faces
   - Low confidence
3. Call `BehaviorAnalyzer.analyze_face_detection_patterns()`
4. Verify scores calculated correctly
5. Verify patterns detected (e.g., 'multiple_faces_detected')

**Expected Result:**
- Suspicious face patterns detected
- Appropriate scoring applied

### Test 3.4: Overall Suspicious Score Calculation
**Objective:** Verify weighted scoring combines all analyses
**Steps:**
1. Run all three analyses (mouse, keystroke, face)
2. Call `BehaviorAnalyzer.calculate_suspicious_score()`
3. Verify weighted calculation (30% mouse, 30% keystroke, 40% face)
4. Verify `suspicious_activity_score` updated in database
5. Verify risk level assigned correctly

**Expected Result:**
- Overall score calculated correctly
- Risk level: minimal (<0.2), low (0.2-0.4), medium (0.4-0.6), high (0.6-0.8), critical (>=0.8)

## 4. Heartbeat Monitoring Tests

### Test 4.1: Heartbeat Endpoint
**Objective:** Verify heartbeat endpoint receives and logs activity
**Steps:**
1. Start exam attempt
2. Send heartbeat POST to `/attempts/{id}/heartbeat/`
3. Verify `last_activity` timestamp updated
4. Verify response includes status 'ok' and timestamp

**Expected Result:**
- Heartbeat received and processed
- Last activity updated

### Test 4.2: Heartbeat with Session Validation
**Objective:** Verify heartbeat validates session token
**Steps:**
1. Start exam attempt
2. Send heartbeat with invalid session token
3. Verify request rejected with 403
4. Verify security event logged (session_hijack)

**Expected Result:**
- Invalid heartbeat rejected
- Security violation logged

### Test 4.3: Heartbeat Status Tracking
**Objective:** Verify heartbeat tracks connection status
**Steps:**
1. Start exam attempt
2. Send heartbeat with status 'active'
3. Simulate tab switch - send heartbeat with status 'suspended'
4. Simulate offline - send heartbeat with status 'disconnected'
5. Verify status changes tracked

**Expected Result:**
- Connection status tracked correctly
- Status changes logged

### Test 4.4: Heartbeat Interval
**Objective:** Verify heartbeat is sent at correct intervals
**Steps:**
1. Start exam attempt
2. Verify frontend sends heartbeat every 30 seconds (default)
3. Monitor backend logs for heartbeat timestamps
4. Verify interval consistency

**Expected Result:**
- Heartbeat sent at configured interval
- Consistent timing maintained

## 5. Audit Logging Tests

### Test 5.1: Security Event Logging
**Objective:** Verify all security events are logged
**Steps:**
1. Trigger various security events:
   - exam_start
   - exam_submit
   - tab_switch
   - device_lock
   - security_violation
2. Verify AuditLog entries created for each
3. Verify correct action, severity, description
4. Verify device_fingerprint and session_token logged

**Expected Result:**
- All security events logged
- Complete metadata captured

### Test 5.2: Audit Log Querying
**Objective:** Verify audit logs can be queried effectively
**Steps:**
1. Generate multiple audit events
2. Query by user, action, severity, time range
3. Verify results filtered correctly
4. Verify ordering works (most recent first)

**Expected Result:**
- Audit logs queryable by various filters
- Results accurate and properly ordered

### Test 5.3: Audit Log Resolution
**Objective:** Verify security incidents can be marked as resolved
**Steps:**
1. Create high-severity security event
2. Mark as resolved with admin user
3. Verify `is_resolved = True`
4. Verify `resolved_at` and `resolved_by` set

**Expected Result:**
- Security incidents can be resolved
- Resolution metadata captured

## 6. Integration Tests

### Test 6.1: Complete Exam Flow with Security
**Objective:** Verify full exam flow with all security measures
**Steps:**
1. Start exam (device locked, session created, event logged)
2. Take exam (heartbeats sent, answers auto-saved)
3. Trigger tab switch (logged, count incremented)
4. Submit exam (session validated, device verified)
5. Verify grading initiated
6. Verify all security events logged correctly

**Expected Result:**
- Complete flow works seamlessly
- All security measures applied
- Comprehensive audit trail

### Test 6.2: Security Violation Response
**Objective:** Verify system responds appropriately to security violations
**Steps:**
1. Simulate high-risk attempt (multiple violations)
2. Verify suspicious_score >= 0.6
3. Verify examiner notified
4. Verify exam flagged for review
5. Verify dashboard shows high-risk attempt

**Expected Result:**
- High-risk attempts flagged
- Appropriate notifications sent
- Dashboard reflects security status

## 7. Performance Tests

### Test 7.1: Heartbeat Performance
**Objective:** Verify heartbeat endpoint handles concurrent requests
**Steps:**
1. Simulate 100 concurrent heartbeat requests
2. Measure response time
3. Verify all requests processed successfully
4. Verify no database locks or deadlocks

**Expected Result:**
- Heartbeat handles concurrent load
- Response time < 100ms
- No performance degradation

### Test 7.2: Security Event Logging Performance
**Objective:** Verify audit logging doesn't impact performance
**Steps:**
1. Generate 1000 security events rapidly
2. Measure logging time
3. Verify database performance maintained
4. Verify no queue buildup

**Expected Result:**
- Audit logging efficient
- Minimal performance impact

## Test Execution Commands

### Run All Security Tests
```bash
cd backend
pytest tests/test_security.py -v
```

### Run Specific Test
```bash
pytest tests/test_security.py::SecurityUtilsTestCase::test_generate_device_fingerprint -v
```

### Run with Coverage
```bash
pytest tests/test_security.py --cov=security_utils --cov=proctoring_utils --cov-report=html
```

## Success Criteria

- All unit tests pass
- All integration tests pass
- Performance benchmarks met
- No security bypasses found
- Audit trail complete and accurate
- Frontend-backend integration verified

## Known Limitations

1. Webcam monitoring is simulated (not actual webcam feed)
2. Face detection uses simulated data for testing
3. Device fingerprint can be bypassed with advanced spoofing
4. Heartbeat relies on client-side honesty (can be spoofed)

## Recommendations

1. Implement actual webcam integration for production
2. Add CAPTCHA for additional verification
3. Implement rate limiting on security endpoints
4. Add machine learning for advanced pattern detection
5. Implement real-time alerting for critical security events
