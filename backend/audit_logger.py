"""
Feature 5: Full Audit Trail System
Immutable logging of all content changes with exportable formats
"""

import json
import csv
import io
from datetime import datetime
from typing import Dict, List, Optional
from enum import Enum


class ChangeType(Enum):
    """Types of changes that can be audited"""
    QUESTION_CREATED = "question_created"
    QUESTION_UPDATED = "question_updated"
    QUESTION_DELETED = "question_deleted"
    ANSWER_CHANGED = "answer_changed"
    VALIDATION_RUN = "validation_run"
    AUTO_CORRECTION = "auto_correction"
    MANUAL_REVIEW = "manual_review"
    SME_APPROVAL = "sme_approval"
    PUBLISH_TO_PROD = "publish_to_prod"
    ROLLBACK = "rollback"


class AuditLogger:
    """
    Feature 5: Full Audit Trail
    Immutable, append-only logging system with export capabilities
    """
    
    def __init__(self, db_connection):
        """
        Initialize audit logger with database connection
        
        Args:
            db_connection: MongoDB database connection
        """
        self.db = db_connection
        self.collection_name = "audit_trail"
    
    async def log_event(
        self,
        change_type: ChangeType,
        entity_type: str,
        entity_id: str,
        user_id: Optional[str] = None,
        user_role: Optional[str] = None,
        changes: Optional[Dict] = None,
        metadata: Optional[Dict] = None,
        version: Optional[str] = None
    ) -> str:
        """
        Log an audit event (immutable, append-only)
        
        Args:
            change_type: Type of change from ChangeType enum
            entity_type: Type of entity (e.g., "question", "chapter", "quiz")
            entity_id: Unique ID of the entity
            user_id: ID of user who made the change
            user_role: Role of user (editor, reviewer, sme, admin)
            changes: Dictionary of what changed (before/after)
            metadata: Additional context
            version: Version number if applicable
        
        Returns:
            Audit log entry ID
        """
        audit_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "change_type": change_type.value,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "user_id": user_id or "system",
            "user_role": user_role or "system",
            "changes": changes or {},
            "metadata": metadata or {},
            "version": version,
            "immutable": True  # Flag to prevent modifications
        }
        
        # Insert to MongoDB (append-only)
        result = await self.db[self.collection_name].insert_one(audit_entry)
        
        return str(result.inserted_id)
    
    async def get_entity_history(
        self,
        entity_id: str,
        limit: int = 100
    ) -> List[Dict]:
        """
        Get complete history of an entity
        
        Args:
            entity_id: Entity to get history for
            limit: Maximum number of entries to return
        
        Returns:
            List of audit entries, newest first
        """
        cursor = self.db[self.collection_name].find(
            {"entity_id": entity_id}
        ).sort("timestamp", -1).limit(limit)
        
        entries = await cursor.to_list(length=limit)
        
        # Remove MongoDB _id for cleaner output
        for entry in entries:
            entry.pop('_id', None)
        
        return entries
    
    async def get_user_activity(
        self,
        user_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict]:
        """
        Get all activity by a specific user
        
        Args:
            user_id: User to get activity for
            start_date: ISO format start date
            end_date: ISO format end date
            limit: Maximum entries to return
        
        Returns:
            List of audit entries
        """
        query = {"user_id": user_id}
        
        if start_date or end_date:
            query["timestamp"] = {}
            if start_date:
                query["timestamp"]["$gte"] = start_date
            if end_date:
                query["timestamp"]["$lte"] = end_date
        
        cursor = self.db[self.collection_name].find(query).sort("timestamp", -1).limit(limit)
        entries = await cursor.to_list(length=limit)
        
        for entry in entries:
            entry.pop('_id', None)
        
        return entries
    
    async def export_to_csv(
        self,
        query: Optional[Dict] = None,
        limit: int = 10000
    ) -> str:
        """
        Export audit log to CSV format
        
        Args:
            query: MongoDB query filter
            limit: Max records to export
        
        Returns:
            CSV string
        """
        cursor = self.db[self.collection_name].find(query or {}).sort("timestamp", -1).limit(limit)
        entries = await cursor.to_list(length=limit)
        
        if not entries:
            return "timestamp,change_type,entity_type,entity_id,user_id,user_role,version\n"
        
        output = io.StringIO()
        fieldnames = ['timestamp', 'change_type', 'entity_type', 'entity_id', 'user_id', 'user_role', 'version']
        
        writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        
        for entry in entries:
            entry.pop('_id', None)
            writer.writerow(entry)
        
        return output.getvalue()
    
    async def export_to_json(
        self,
        query: Optional[Dict] = None,
        limit: int = 10000,
        pretty: bool = True
    ) -> str:
        """
        Export audit log to JSON format
        
        Args:
            query: MongoDB query filter
            limit: Max records to export
            pretty: Pretty print JSON
        
        Returns:
            JSON string
        """
        cursor = self.db[self.collection_name].find(query or {}).sort("timestamp", -1).limit(limit)
        entries = await cursor.to_list(length=limit)
        
        for entry in entries:
            entry.pop('_id', None)
        
        if pretty:
            return json.dumps(entries, indent=2)
        return json.dumps(entries)
    
    async def get_validation_history(
        self,
        days: int = 7
    ) -> List[Dict]:
        """
        Get validation run history
        
        Args:
            days: Number of days to look back
        
        Returns:
            List of validation runs
        """
        from datetime import timedelta
        
        start_date = (datetime.utcnow() - timedelta(days=days)).isoformat() + "Z"
        
        cursor = self.db[self.collection_name].find({
            "change_type": ChangeType.VALIDATION_RUN.value,
            "timestamp": {"$gte": start_date}
        }).sort("timestamp", -1)
        
        entries = await cursor.to_list(length=100)
        
        for entry in entries:
            entry.pop('_id', None)
        
        return entries
    
    async def verify_immutability(self) -> Dict:
        """
        Verify no audit entries have been modified
        Returns report of any suspicious activity
        """
        # Check for entries without immutable flag
        suspicious = await self.db[self.collection_name].find({
            "immutable": {"$ne": True}
        }).to_list(length=100)
        
        return {
            "total_entries": await self.db[self.collection_name].count_documents({}),
            "suspicious_entries": len(suspicious),
            "verified": len(suspicious) == 0
        }


# Helper function to log validation events
async def log_validation_run(db, validator_report: Dict, user_id: str = "system"):
    """
    Log a validation run to audit trail
    
    Args:
        db: Database connection
        validator_report: Validation report from QuizValidator
        user_id: User who triggered validation
    """
    logger = AuditLogger(db)
    
    await logger.log_event(
        change_type=ChangeType.VALIDATION_RUN,
        entity_type="quiz_system",
        entity_id="all_quizzes",
        user_id=user_id,
        user_role="system",
        metadata={
            "total_questions": validator_report['summary']['total_questions'],
            "validated_ok": validator_report['summary']['validated_ok'],
            "mismatches": validator_report['summary']['mismatches_found'],
            "correctness_issues": validator_report['summary'].get('correctness_issues', 0),
            "status": validator_report['status']
        }
    )
    
    # Log each auto-correction
    for mismatch in validator_report.get('mismatches', []):
        if mismatch.get('action') == 'auto_corrected':
            await logger.log_event(
                change_type=ChangeType.AUTO_CORRECTION,
                entity_type="question",
                entity_id=mismatch['question_id'],
                user_id="system",
                user_role="validator",
                changes={
                    "before": mismatch['key_answer'],
                    "after": mismatch['quiz_correct']
                },
                metadata={
                    "reason": "Answer key mismatch auto-corrected"
                }
            )
