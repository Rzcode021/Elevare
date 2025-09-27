"""
Utility functions for making webhook calls to n8n workflows.
Handles error handling, timeouts, and JSON response processing.
"""
import requests
import logging
from django.conf import settings
from typing import Dict, Any, Optional, Tuple

logger = logging.getLogger(__name__)

def call_n8n_webhook(
    webhook_url: str, 
    payload: Dict[str, Any], 
    timeout: int = 120
) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
    """
    Make a POST request to an n8n webhook and return the response.
    
    Args:
        webhook_url: The n8n webhook URL
        payload: The data to send as JSON
        timeout: Request timeout in seconds
        
    Returns:
        Tuple of (success: bool, response_data: dict or None, error_message: str or None)
    """
    if not webhook_url or 'YOUR_N8N' in webhook_url:
        return False, None, "Webhook URL not configured"
    
    try:
        logger.info(f"🔗 Calling n8n webhook: {webhook_url}")
        logger.info(f"📦 Payload size: {len(str(payload))} characters")
        logger.debug(f"📋 Payload: {payload}")
        
        import time
        start_time = time.time()
        
        response = requests.post(
            webhook_url, 
            json=payload, 
            timeout=timeout,
            headers={'Content-Type': 'application/json'}
        )
        
        end_time = time.time()
        duration = end_time - start_time
        logger.info(f"⏱️ Webhook call completed in {duration:.2f} seconds")
        
        # Check if the request was successful
        response.raise_for_status()
        
        # Try to parse JSON response
        try:
            response_data = response.json()
            logger.info(f"Webhook call successful. Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Not a dict'}")
            return True, response_data, None
        except ValueError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            return False, None, f"Invalid JSON response: {e}"
            
    except requests.exceptions.Timeout:
        logger.error(f"Webhook call timed out after {timeout} seconds")
        return False, None, f"Request timed out after {timeout} seconds (2 minutes). Your n8n workflow may need optimization for faster processing."
    except requests.exceptions.ConnectionError as e:
        logger.error(f"Connection error calling webhook: {e}")
        return False, None, f"Connection error: {e}"
    except requests.exceptions.HTTPError as e:
        logger.error(f"HTTP error calling webhook: {e}")
        return False, None, f"HTTP error: {e}"
    except Exception as e:
        logger.error(f"Unexpected error calling webhook: {e}")
        return False, None, f"Unexpected error: {e}"


def trigger_profile_webhook(profile_data: Dict[str, Any]) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
    """
    Trigger the n8n webhook for profile submission.
    
    Args:
        profile_data: The user's profile information
        
    Returns:
        Tuple of (success: bool, response_data: dict or None, error_message: str or None)
    """
    webhook_url = getattr(settings, 'N8N_PROFILE_WEBHOOK_URL', '')
    
    payload = {
        'profile_data': profile_data,
        'timestamp': profile_data.get('timestamp'),
        'user_id': profile_data.get('user_id'),
        'action': 'profile_submission'
    }
    
    return call_n8n_webhook(webhook_url, payload, timeout=120)


def trigger_career_roadmap_webhook(
    assessment_data: Dict[str, Any], 
    profile_data: Optional[Dict[str, Any]] = None
) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
    """
    Trigger the n8n webhook for career roadmap guidance.
    
    Args:
        assessment_data: The assessment results and scores
        profile_data: Optional additional profile information
        
    Returns:
        Tuple of (success: bool, response_data: dict or None, error_message: str or None)
    """
    webhook_url = getattr(settings, 'N8N_CAREER_ROADMAP_WEBHOOK_URL', '')
    
    payload = {
        'assessment_data': assessment_data,
        'profile_data': profile_data,
        'action': 'career_roadmap_generation',
        'timestamp': assessment_data.get('timestamp')
    }
    
    return call_n8n_webhook(webhook_url, payload, timeout=120)


def trigger_assessment_webhook(profile_data: Dict[str, Any], num_questions: int = 12) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
    """
    Trigger the n8n webhook for assessment question generation.
    
    Args:
        profile_data: The user's profile information
        num_questions: Number of questions to generate
        
    Returns:
        Tuple of (success: bool, response_data: dict or None, error_message: str or None)
    """
    webhook_url = getattr(settings, 'N8N_ASSESSMENT_WEBHOOK_URL', '')
    
    payload = {
        'initial_profile': profile_data,
        'num_questions': num_questions,
        'min_questions': 10,
        'max_questions': 15,
        'action': 'assessment_generation'
    }
    
    return call_n8n_webhook(webhook_url, payload, timeout=120)


def trigger_analysis_webhook(analysis_data: Dict[str, Any]) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
    """
    Trigger the n8n webhook for assessment analysis.
    
    Args:
        analysis_data: The assessment analysis data
        
    Returns:
        Tuple of (success: bool, response_data: dict or None, error_message: str or None)
    """
    webhook_url = getattr(settings, 'N8N_ANALYSIS_WEBHOOK_URL', '')
    
    payload = {
        'category_scores': analysis_data.get('category_scores', {}),
        'personality_traits': analysis_data.get('personality_traits', {}),
        'action': 'assessment_analysis'
    }
    
    return call_n8n_webhook(webhook_url, payload, timeout=120)
