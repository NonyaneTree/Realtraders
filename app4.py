import cv2
import numpy as np
from skimage import measure
from skimage.filters import threshold_otsu
import pandas as pd
import talib

def detect_chart_patterns(image):
    """Detect chart patterns, support/resistance zones, and trendlines"""
    patterns = []
    
    # Convert to grayscale if needed
    if len(image.shape) > 2:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
    
    # Detect patterns
    patterns.extend(_detect_classic_patterns(gray))
    patterns.extend(_detect_support_resistance(gray))
    patterns.extend(_detect_trendlines(gray))
    
    return patterns

def _detect_classic_patterns(image):
    """Detect classic chart patterns"""
    patterns = []
    
    # Find contours
    thresh = threshold_otsu(image)
    binary = image > thresh
    contours = measure.find_contours(binary, 0.8)
    
    # Pattern detection logic would be more sophisticated in production
    for contour in contours:
        if len(contour) >= 5:
            patterns.append({
                'type': 'pattern',
                'name': 'Head and Shoulders',
                'confidence': 0.85,
                'description': 'Reversal pattern with three peaks',
                'points': contour.tolist()
            })
    
    return patterns

def _detect_support_resistance(image):
    """Detect support/resistance zones"""
    zones = []
    
    # Horizontal line detection (simplified)
    edges = cv2.Canny(image, 50, 150)
    lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=50, minLineLength=100, maxLineGap=10)
    
    if lines is not None:
        horizontal_lines = []
        for line in lines:
            x1, y1, x2, y2 = line[0]
            angle = np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi
            if abs(angle) < 10:  # Nearly horizontal
                horizontal_lines.append((y1 + y2) / 2)
        
        # Cluster similar horizontal lines into zones
        if len(horizontal_lines) > 0:
            from sklearn.cluster import DBSCAN
            clustering = DBSCAN(eps=10, min_samples=2).fit(np.array(horizontal_lines).reshape(-1, 1))
            labels = clustering.labels_
            
            for label in set(labels):
                if label != -1:  # -1 is noise
                    cluster_points = np.array(horizontal_lines)[labels == label]
                    zone_level = np.mean(cluster_points)
                    zones.append({
                        'type': 'zone',
                        'name': 'Support/Resistance',
                        'level': float(zone_level),
                        'confidence': 0.8,
                        'description': f'Key price level at {zone_level:.2f}'
                    })
    
    return zones

def _detect_trendlines(image):
    """Detect trendlines"""
    trendlines = []
    
    # Edge detection
    edges = cv2.Canny(image, 50, 150)
    
    # Line detection
    lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=50, minLineLength=100, maxLineGap=10)
    
    if lines is not None:
        for line in lines:
            x1, y1, x2, y2 = line[0]
            angle = np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi
            
            # Filter for meaningful trendline angles
            if 15 < abs(angle) < 75:
                trend_type = 'Up Trend' if angle < 0 else 'Down Trend'
                trendlines.append({
                    'type': 'trendline',
                    'name': trend_type,
                    'points': [[float(x1), float(y1)], [float(x2), float(y2)]],
                    'confidence': 0.7,
                    'description': f'{trend_type} line'
                })
    
    return trendlines
