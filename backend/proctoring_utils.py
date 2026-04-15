"""
Advanced proctoring and behavior analysis utilities
"""
import json
import math
import statistics
from datetime import datetime, timedelta
from django.utils import timezone
from collections import defaultdict, deque


class BehaviorAnalyzer:
    """Advanced behavior pattern detection and analysis"""
    
    def __init__(self, attempt):
        self.attempt = attempt
        self.mouse_events = deque(maxlen=1000)  # Last 1000 mouse events
        self.keystroke_events = deque(maxlen=500)  # Last 500 keystrokes
        self.face_detection_events = deque(maxlen=100)  # Last 100 face detections
        self.afk_events = deque(maxlen=50)  # Last 50 AFK events
        
    def add_mouse_event(self, x, y, timestamp, event_type='move'):
        """Add mouse movement event for analysis"""
        self.mouse_events.append({
            'x': x,
            'y': y,
            'timestamp': timestamp,
            'type': event_type
        })
        
    def add_keystroke_event(self, key, timestamp, duration):
        """Add keystroke event for timing analysis"""
        self.keystroke_events.append({
            'key': key,
            'timestamp': timestamp,
            'duration': duration  # Time between this and previous keystroke
        })
        
    def add_face_detection_event(self, faces_detected, timestamp, confidence):
        """Add face detection event"""
        self.face_detection_events.append({
            'faces_detected': faces_detected,
            'timestamp': timestamp,
            'confidence': confidence
        })
        
        # Update face detection count
        if faces_detected == 0:
            self.attempt.face_detection_count += 1
            
    def add_afk_event(self, duration, timestamp):
        """Add away-from-keyboard event"""
        self.afk_events.append({
            'duration': duration,
            'timestamp': timestamp
        })
        
        self.attempt.away_from_keyboard_count += 1
        
    def analyze_mouse_patterns(self):
        """Analyze mouse movement patterns for suspicious behavior"""
        if len(self.mouse_events) < 10:
            return {'score': 0.0, 'patterns': []}
            
        patterns = []
        score = 0.0
        
        # Calculate mouse velocity
        velocities = []
        for i in range(1, len(self.mouse_events)):
            prev = self.mouse_events[i-1]
            curr = self.mouse_events[i]
            
            time_diff = (curr['timestamp'] - prev['timestamp']).total_seconds()
            if time_diff > 0:
                distance = math.sqrt((curr['x'] - prev['x'])**2 + (curr['y'] - prev['y'])**2)
                velocity = distance / time_diff
                velocities.append(velocity)
        
        # Detect unnatural movement patterns
        if velocities:
            avg_velocity = statistics.mean(velocities)
            std_velocity = statistics.stdev(velocities) if len(velocities) > 1 else 0
            
            # Too consistent movement (possible bot)
            if std_velocity < avg_velocity * 0.1:
                patterns.append('unnatural_consistency')
                score += 0.3
                
            # Extremely fast movements (possible automation)
            if avg_velocity > 2000:  # pixels per second
                patterns.append('excessive_speed')
                score += 0.4
                
            # No movement for long periods (possible AFK)
            if len(velocities) == 0 or max(velocities) < 10:
                patterns.append('minimal_movement')
                score += 0.2
        
        # Detect click patterns
        clicks = [e for e in self.mouse_events if e['type'] == 'click']
        if len(clicks) > 0:
            click_intervals = []
            for i in range(1, len(clicks)):
                interval = (clicks[i]['timestamp'] - clicks[i-1]['timestamp']).total_seconds()
                click_intervals.append(interval)
                
            if click_intervals:
                # Perfectly timed clicks (possible bot)
                if statistics.stdev(click_intervals) < 0.1:
                    patterns.append('robotic_clicking')
                    score += 0.5
        
        return {'score': min(score, 1.0), 'patterns': patterns}
    
    def analyze_keystroke_patterns(self):
        """Analyze keystroke timing patterns"""
        if len(self.keystroke_events) < 20:
            return {'score': 0.0, 'patterns': []}
            
        patterns = []
        score = 0.0
        
        # Extract keystroke intervals
        intervals = [e['duration'] for e in self.keystroke_events if e['duration'] > 0]
        
        if intervals:
            avg_interval = statistics.mean(intervals)
            std_interval = statistics.stdev(intervals) if len(intervals) > 1 else 0
            
            # Too consistent typing (possible copy-paste or bot)
            if std_interval < avg_interval * 0.15:
                patterns.append('unnatural_typing_rhythm')
                score += 0.4
                
            # Extremely fast typing (possible automation)
            if avg_interval < 0.05:  # Less than 50ms between keystrokes
                patterns.append('superhuman_typing_speed')
                score += 0.3
                
            # Detect burst typing (possible copy-paste)
            burst_threshold = avg_interval * 0.3
            burst_count = sum(1 for i in intervals if i < burst_threshold)
            if burst_count > len(intervals) * 0.7:
                patterns.append('burst_typing_pattern')
                score += 0.6
        
        return {'score': min(score, 1.0), 'patterns': patterns}
    
    def analyze_face_detection_patterns(self):
        """Analyze face detection patterns"""
        if len(self.face_detection_events) < 5:
            return {'score': 0.0, 'patterns': []}
            
        patterns = []
        score = 0.0
        
        # Count face detection failures
        no_face_events = [e for e in self.face_detection_events if e['faces_detected'] == 0]
        multiple_face_events = [e for e in self.face_detection_events if e['faces_detected'] > 1]
        
        # Too many face detection failures
        if len(no_face_events) > len(self.face_detection_events) * 0.3:
            patterns.append('frequent_face_absence')
            score += 0.4
            
        # Multiple faces detected (possible cheating)
        if len(multiple_face_events) > 0:
            patterns.append('multiple_faces_detected')
            score += 0.8
            
        # Calculate average confidence
        confidences = [e['confidence'] for e in self.face_detection_events if e['confidence'] > 0]
        if confidences:
            avg_confidence = statistics.mean(confidences)
            if avg_confidence < 0.7:
                patterns.append('low_face_detection_confidence')
                score += 0.3
        
        return {'score': min(score, 1.0), 'patterns': patterns}
    
    def calculate_suspicious_score(self):
        """Calculate overall suspicious activity score"""
        mouse_analysis = self.analyze_mouse_patterns()
        keystroke_analysis = self.analyze_keystroke_patterns()
        face_analysis = self.analyze_face_detection_patterns()
        
        # Weighted scoring
        weights = {
            'mouse': 0.3,
            'keystroke': 0.3,
            'face': 0.4
        }
        
        total_score = (
            mouse_analysis['score'] * weights['mouse'] +
            keystroke_analysis['score'] * weights['keystroke'] +
            face_analysis['score'] * weights['face']
        )
        
        # Update attempt score
        self.attempt.suspicious_activity_score = total_score
        self.attempt.save()
        
        return {
            'total_score': total_score,
            'mouse_analysis': mouse_analysis,
            'keystroke_analysis': keystroke_analysis,
            'face_analysis': face_analysis,
            'risk_level': self.get_risk_level(total_score)
        }
    
    def get_risk_level(self, score):
        """Determine risk level based on score"""
        if score >= 0.8:
            return 'critical'
        elif score >= 0.6:
            return 'high'
        elif score >= 0.4:
            return 'medium'
        elif score >= 0.2:
            return 'low'
        else:
            return 'minimal'
    
    def generate_proctoring_report(self):
        """Generate comprehensive proctoring report"""
        analysis = self.calculate_suspicious_score()
        
        report = {
            'attempt_id': self.attempt.id,
            'student': self.attempt.student.username,
            'exam': self.attempt.exam.title,
            'analysis_timestamp': timezone.now().isoformat(),
            'risk_level': analysis['risk_level'],
            'suspicious_score': analysis['total_score'],
            'summary': {
                'tab_switches': self.attempt.tab_switch_count,
                'face_detection_failures': self.attempt.face_detection_count,
                'afk_events': self.attempt.away_from_keyboard_count,
                'security_violations': len(self.attempt.security_violations)
            },
            'patterns_detected': (
                analysis['mouse_analysis']['patterns'] +
                analysis['keystroke_analysis']['patterns'] +
                analysis['face_analysis']['patterns']
            ),
            'recommendations': self.generate_recommendations(analysis)
        }
        
        # Add to proctoring log
        self.attempt.proctoring_log.append(report)
        self.attempt.save()
        
        return report
    
    def generate_recommendations(self, analysis):
        """Generate recommendations based on analysis"""
        recommendations = []
        
        if analysis['total_score'] >= 0.8:
            recommendations.append('Immediate review required - high probability of cheating')
        elif analysis['total_score'] >= 0.6:
            recommendations.append('Manual review recommended - suspicious patterns detected')
        elif analysis['total_score'] >= 0.4:
            recommendations.append('Monitor closely - moderate risk indicators')
        
        if 'multiple_faces_detected' in analysis['face_analysis']['patterns']:
            recommendations.append('Investigate potential collaboration or external assistance')
            
        if 'unnatural_typing_rhythm' in analysis['keystroke_analysis']['patterns']:
            recommendations.append('Verify student identity - possible automation detected')
            
        if 'robotic_clicking' in analysis['mouse_analysis']['patterns']:
            recommendations.append('Check for automated tools or scripts')
        
        return recommendations


class WebcamMonitor:
    """Simulated webcam monitoring system"""
    
    def __init__(self, attempt):
        self.attempt = attempt
        self.is_monitoring = False
        self.monitoring_interval = 30  # seconds
        
    def start_monitoring(self):
        """Start webcam monitoring (simulated)"""
        self.attempt.webcam_monitored = True
        self.attempt.save()
        self.is_monitoring = True
        
        # Log monitoring start
        from security_utils import log_security_event
        log_security_event(
            user=self.attempt.student,
            action='webcam_monitoring_started',
            description=f'Webcam monitoring started for exam {self.attempt.exam.title}',
            severity='low',
            model_name='ExamAttempt',
            object_id=self.attempt.id
        )
        
    def stop_monitoring(self):
        """Stop webcam monitoring"""
        self.attempt.webcam_monitored = False
        self.attempt.save()
        self.is_monitoring = False
        
        # Log monitoring stop
        from security_utils import log_security_event
        log_security_event(
            user=self.attempt.student,
            action='webcam_monitoring_stopped',
            description=f'Webcam monitoring stopped for exam {self.attempt.exam.title}',
            severity='low',
            model_name='ExamAttempt',
            object_id=self.attempt.id
        )
    
    def simulate_face_detection(self):
        """Simulate face detection (for demo purposes)"""
        import random
        
        # Simulate face detection results
        faces_detected = random.choices([0, 1, 2], weights=[10, 85, 5])[0]
        confidence = random.uniform(0.6, 0.95) if faces_detected > 0 else 0.0
        
        return {
            'faces_detected': faces_detected,
            'confidence': confidence,
            'timestamp': timezone.now()
        }
    
    def check_environment(self):
        """Check exam environment (simulated)"""
        import random
        
        violations = []
        
        # Simulate environment checks
        if random.random() < 0.1:  # 10% chance of detecting issues
            violations.append(random.choice([
                'multiple_people_detected',
                'unauthorized_materials_visible',
                'suspicious_background_noise',
                'inadequate_lighting'
            ]))
        
        return {
            'environment_safe': len(violations) == 0,
            'violations': violations,
            'timestamp': timezone.now()
        }
