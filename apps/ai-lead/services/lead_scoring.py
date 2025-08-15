import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, LabelEncoder
import os
from typing import List, Dict, Any
import asyncio
from pathlib import Path

from models.schemas import LeadScoreRequest, LeadScoreData

class LeadScoringService:
    def __init__(self):
        self.model = None
        self.feature_names = []
        self.model_path = Path(__file__).parent.parent / "models" / "lead_scoring_model.joblib"
        
    async def load_model(self):
        """Load the trained model or train a new one if not exists"""
        if self.model_path.exists():
            self.model = joblib.load(self.model_path)
            print(f"Model loaded from {self.model_path}")
        else:
            print("Model not found, training new model...")
            await self.train_model()
            
    async def train_model(self):
        """Train the model with synthetic data"""
        # Generate synthetic training data
        training_data = self._generate_synthetic_data(1000)
        
        # Prepare features
        X = self._prepare_features(training_data)
        y = training_data['score'].values
        
        # Create and train pipeline
        self.model = self._create_pipeline()
        self.model.fit(X, y)
        
        # Save model
        os.makedirs(self.model_path.parent, exist_ok=True)
        joblib.dump(self.model, self.model_path)
        print(f"Model trained and saved to {self.model_path}")
        
    def _generate_synthetic_data(self, n_samples: int) -> pd.DataFrame:
        """Generate synthetic training data"""
        np.random.seed(42)
        
        sources = ['website', 'social_media', 'referral', 'email_campaign', 'cold_call']
        channels = ['organic_search', 'paid_search', 'social', 'email', 'direct']
        
        data = []
        for i in range(n_samples):
            # Generate features
            source = np.random.choice(sources)
            channel = np.random.choice(channels)
            page_views = np.random.poisson(3) + 1
            time_on_site = np.random.exponential(200) + 30
            num_form_fields = np.random.poisson(2)
            
            # Generate messages with different quality
            message_templates = [
                "interested in pricing",
                "need more information",
                "enterprise solution required",
                "budget is limited",
                "looking for alternatives",
                "ready to purchase",
                "just browsing",
                "urgent requirement"
            ]
            
            messages = np.random.choice(message_templates, 
                                      size=min(3, len(message_templates)), 
                                      replace=False).tolist()
            combined_messages = " ".join(messages)
            
            # Calculate score based on features (synthetic logic)
            score = 0.0
            
            # Source contribution
            if source == 'referral': score += 0.3
            elif source == 'website': score += 0.2
            elif source == 'social_media': score += 0.1
            
            # Page views contribution
            score += min(page_views * 0.05, 0.2)
            
            # Time on site contribution
            score += min(time_on_site / 1000, 0.2)
            
            # Form fields contribution
            score += min(num_form_fields * 0.1, 0.2)
            
            # Message quality contribution
            if any(word in combined_messages.lower() for word in ['enterprise', 'purchase', 'urgent']):
                score += 0.3
            elif any(word in combined_messages.lower() for word in ['pricing', 'information']):
                score += 0.2
            elif any(word in combined_messages.lower() for word in ['limited', 'browsing']):
                score -= 0.1
                
            # Add some noise
            score += np.random.normal(0, 0.1)
            score = max(0, min(1, score))  # Clamp to [0, 1]
            
            # Convert continuous score to discrete class (0 or 1)
            label = 1 if score >= 0.5 else 0
            
            data.append({
                'source': source,
                'channel': channel,
                'page_views': page_views,
                'time_on_site': time_on_site,
                'num_form_fields': num_form_fields,
                'messages': combined_messages,
                'score': label
            })
            
        return pd.DataFrame(data)
    
    def _create_pipeline(self) -> Pipeline:
        """Create ML pipeline"""
        # Text preprocessing for messages
        text_transformer = TfidfVectorizer(
            max_features=100,
            stop_words='english',
            ngram_range=(1, 2)
        )
        
        # Numerical features preprocessing
        numeric_features = ['page_views', 'time_on_site', 'num_form_fields']
        numeric_transformer = StandardScaler()
        
        # Categorical features preprocessing
        categorical_features = ['source', 'channel']
        
        # Combine preprocessors
        from sklearn.preprocessing import OneHotEncoder
        categorical_transformer = OneHotEncoder(drop='first', sparse_output=False, handle_unknown='ignore')
        
        preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, numeric_features),
                ('cat', categorical_transformer, categorical_features),
                ('text', text_transformer, 'messages')
            ],
            remainder='drop',
            sparse_threshold=0
        )
        
        # Create pipeline
        pipeline = Pipeline([
            ('preprocessor', preprocessor),
            ('classifier', LogisticRegression(random_state=42))
        ])
        
        return pipeline
    
    def _prepare_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """Prepare features for training/prediction"""
        return data[['page_views', 'time_on_site', 'num_form_fields', 'source', 'channel', 'messages']]
    
    async def score_lead(self, request: LeadScoreRequest) -> LeadScoreData:
        """Score a lead based on the request data"""
        if self.model is None:
            raise ValueError("Model not loaded")
            
        # Convert request to DataFrame
        data = self._request_to_dataframe(request)
        
        # Prepare features
        X = self._prepare_features(data)
        
        # Get prediction probabilities
        probabilities = self.model.predict_proba(X)[0]
        # Use probability of positive class (class 1) as score
        score = probabilities[1] if len(probabilities) > 1 else probabilities[0]
        
        # Get top features (simplified)
        top_features = self._get_top_features(request)
        
        # Determine category and confidence
        confidence = max(probabilities)
        if score >= 0.7:
            category = "hot"
        elif score >= 0.4:
            category = "warm"
        else:
            category = "cold"
            
        return LeadScoreData(
            score=float(score),
            top_features=top_features,
            confidence=float(confidence),
            category=category
        )
    
    def _request_to_dataframe(self, request: LeadScoreRequest) -> pd.DataFrame:
        """Convert request to DataFrame format"""
        # Combine messages
        combined_messages = " ".join(request.lastMessages)
        
        data = {
            'source': request.source,
            'channel': request.channel,
            'page_views': request.pageViews,
            'time_on_site': request.timeOnSite,
            'num_form_fields': len(request.formFields),
            'messages': combined_messages
        }
        
        return pd.DataFrame([data])
    
    def _get_top_features(self, request: LeadScoreRequest) -> List[str]:
        """Get top contributing features (simplified logic)"""
        features = []
        
        # Check page views
        if request.pageViews >= 5:
            features.append("high_page_views")
        
        # Check time on site
        if request.timeOnSite >= 300:  # 5 minutes
            features.append("long_session_duration")
            
        # Check pages visited
        important_pages = ['pricing', 'contact', 'demo', 'enterprise']
        for page in request.pages:
            for keyword in important_pages:
                if keyword in page.lower():
                    features.append(f"{keyword}_page_visit")
                    break
                
        # Check messages for keywords
        combined_messages = " ".join(request.lastMessages).lower()
        if any(word in combined_messages for word in ['enterprise', 'urgent', 'purchase']):
            features.append("high_intent_keywords")
        elif any(word in combined_messages for word in ['pricing', 'information', 'demo']):
            features.append("medium_intent_keywords")
            
        # Check form fields
        if len(request.formFields) >= 3:
            features.append("detailed_form_submission")
            
        # Check source quality
        if request.source in ['referral', 'website']:
            features.append("high_quality_source")
            
        return features[:5]  # Return top 5 features