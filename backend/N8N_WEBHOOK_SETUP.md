# 🔧 n8n Webhook Setup Guide

## 🎯 **Current Status**
- ✅ Webhook URLs are configured correctly
- ❌ Webhook is not active in n8n (404 error)
- 🔧 Need to activate webhook in n8n interface

## 🚨 **Immediate Action Required**

### 1. **Activate Your n8n Webhook**
1. Go to your n8n instance: `https://rehan26072002.app.n8n.cloud`
2. Open the workflow that handles assessment generation
3. **Click the "Execute workflow" button** to activate the webhook
4. The webhook will only work for one call after clicking this button (test mode)

### 2. **Webhook URLs to Configure**
```
Assessment Generation: https://rehan26072002.app.n8n.cloud/webhook-test/assessment-generation
Assessment Analysis: https://rehan26072002.app.n8n.cloud/webhook-test/assessment-analysis
Profile Submission: https://rehan26072002.app.n8n.cloud/webhook-test/profile-input
Career Roadmap: https://rehan26072002.app.n8n.cloud/webhook-test/career-path
```

## 📋 **Expected Webhook Payload Format**

### **Assessment Generation Webhook**
**URL**: `/webhook-test/assessment-generation`
**Method**: POST
**Content-Type**: application/json

```json
{
  "initial_profile": {
    "interests": ["technology", "science"],
    "hobbies": ["programming", "reading"],
    "favoriteSubjects": ["mathematics", "physics"]
  },
  "num_questions": 12,
  "min_questions": 10,
  "max_questions": 15,
  "action": "assessment_generation"
}
```

**Expected Response**:
```json
{
  "questions": [
    {
      "id": 1,
      "questionText": "What is your preferred working style?",
      "options": ["Solo", "Team", "Mixed", "Leadership"],
      "category": "Personality",
      "correctAnswer": "Team"
    }
  ]
}
```

### **Profile Submission Webhook**
**URL**: `/webhook-test/profile-input`
**Method**: POST

```json
{
  "user_id": 123,
  "username": "john_doe",
  "email": "john@example.com",
  "profile_data": {
    "interests": ["technology"],
    "hobbies": ["programming"]
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "action": "profile_submission"
}
```

### **Assessment Analysis Webhook**
**URL**: `/webhook-test/assessment-analysis`
**Method**: POST

```json
{
  "category_scores": {
    "Logical Reasoning": 0.8,
    "Math": 0.9,
    "Interests": 0.7
  },
  "personality_traits": {
    "1": "Yes",
    "2": "Sometimes"
  },
  "action": "assessment_analysis"
}
```

### **Career Roadmap Webhook**
**URL**: `/webhook-test/career-path`
**Method**: POST

```json
{
  "assessment_id": 123,
  "user_id": 456,
  "category_scores": {
    "Logical Reasoning": 0.8,
    "Math": 0.9
  },
  "recommended_careers": [
    {
      "career": "Data Scientist",
      "confidence": 0.85
    }
  ],
  "profile_data": {
    "interests": ["technology"],
    "hobbies": ["programming"]
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "action": "career_roadmap_generation"
}
```

## 🧪 **Testing Your Webhooks**

### **Test Assessment Generation**
```bash
curl -X POST https://rehan26072002.app.n8n.cloud/webhook-test/assessment-generation \
  -H "Content-Type: application/json" \
  -d '{
    "initial_profile": {
      "interests": ["technology"],
      "hobbies": ["programming"]
    },
    "num_questions": 5,
    "action": "assessment_generation"
  }'
```

### **Expected Response**
```json
{
  "questions": [
    {
      "id": 1,
      "questionText": "Which programming language do you prefer?",
      "options": ["Python", "JavaScript", "Java", "C++"],
      "category": "Technical",
      "correctAnswer": "Python"
    }
  ]
}
```

## 🔧 **n8n Workflow Setup**

### **1. Webhook Node Configuration**
- **HTTP Method**: POST
- **Path**: `assessment-generation`
- **Response Mode**: "Respond to Webhook"

### **2. Data Processing**
- Parse the incoming JSON payload
- Extract `initial_profile` data
- Generate questions based on profile
- Return questions in the expected format

### **3. Error Handling**
- Return proper HTTP status codes
- Include error messages in response
- Handle timeout scenarios

## ⚠️ **Important Notes**

1. **Test Mode Limitation**: Webhooks only work for one call after clicking "Execute workflow"
2. **Production Mode**: For continuous operation, you need to deploy the workflow
3. **Response Format**: Must match the expected JSON structure exactly
4. **Timeout**: Backend waits up to 2 minutes for webhook response

## 🚀 **Next Steps**

1. **Activate webhook** in n8n interface
2. **Test webhook** with the provided curl command
3. **Verify response format** matches expected structure
4. **Deploy workflow** for production use
5. **Test full integration** with frontend

Once you activate the webhook in n8n, the "make sure n8n configured properly" error should disappear! 🎉

