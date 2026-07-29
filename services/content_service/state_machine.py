from enum import Enum
from typing import Dict, List, Optional, Callable
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class NoticeState(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    DELETED = "deleted"


class EquipmentState(str, Enum):
    AVAILABLE = "available"
    IN_USE = "in_use"
    MAINTENANCE = "maintenance"
    RETIRED = "retired"


class StateTransition:
    def __init__(
        self,
        from_state: str,
        to_state: str,
        trigger: str,
        conditions: Optional[List[Callable]] = None,
        actions: Optional[List[Callable]] = None
    ):
        self.from_state = from_state
        self.to_state = to_state
        self.trigger = trigger
        self.conditions = conditions or []
        self.actions = actions or []

    def can_execute(self, context: dict) -> bool:
        for condition in self.conditions:
            if not condition(context):
                return False
        return True

    async def execute_actions(self, context: dict):
        for action in self.actions:
            await action(context)


class StateMachine:
    def __init__(self, name: str):
        self.name = name
        self.transitions: List[StateTransition] = []
        self._on_enter: Dict[str, List[Callable]] = {}
        self._on_exit: Dict[str, List[Callable]] = {}

    def add_transition(self, transition: StateTransition):
        self.transitions.append(transition)

    def on_enter(self, state: str, callback: Callable):
        if state not in self._on_enter:
            self._on_enter[state] = []
        self._on_enter[state].append(callback)

    def on_exit(self, state: str, callback: Callable):
        if state not in self._on_exit:
            self._on_exit[state] = []
        self._on_exit[state].append(callback)

    def get_valid_transitions(self, current_state: str) -> List[str]:
        return [t.to_state for t in self.transitions if t.from_state == current_state]

    def can_transition(self, from_state: str, to_state: str, context: dict = None) -> bool:
        for transition in self.transitions:
            if transition.from_state == from_state and transition.to_state == to_state:
                if context is None or transition.can_execute(context):
                    return True
        return False

    async def transition(
        self,
        current_state: str,
        target_state: str,
        context: dict = None
    ) -> str:
        for t in self.transitions:
            if t.from_state == current_state and t.to_state == target_state:
                if context and not t.can_execute(context):
                    raise ValueError(f"Transition conditions not met: {current_state} -> {target_state}")

                if current_state in self._on_exit:
                    for callback in self._on_exit[current_state]:
                        await callback(context or {})

                await t.execute_actions(context or {})

                if target_state in self._on_enter:
                    for callback in self._on_enter[target_state]:
                        await callback(context or {})

                logger.info(f"State machine '{self.name}': {current_state} -> {target_state}")
                return target_state

        raise ValueError(f"Invalid transition: {current_state} -> {target_state}")


def create_notice_state_machine() -> StateMachine:
    sm = StateMachine("notice")

    sm.add_transition(StateTransition(NoticeState.DRAFT, NoticeState.PUBLISHED, "publish"))
    sm.add_transition(StateTransition(NoticeState.DRAFT, NoticeState.DELETED, "delete"))
    sm.add_transition(StateTransition(NoticeState.PUBLISHED, NoticeState.DRAFT, "unpublish"))
    sm.add_transition(StateTransition(NoticeState.PUBLISHED, NoticeState.ARCHIVED, "expire"))
    sm.add_transition(StateTransition(NoticeState.PUBLISHED, NoticeState.ARCHIVED, "archive"))
    sm.add_transition(StateTransition(NoticeState.PUBLISHED, NoticeState.DELETED, "delete"))
    sm.add_transition(StateTransition(NoticeState.ARCHIVED, NoticeState.PUBLISHED, "renew"))

    return sm


def create_equipment_state_machine() -> StateMachine:
    sm = StateMachine("equipment")

    sm.add_transition(StateTransition(EquipmentState.AVAILABLE, EquipmentState.IN_USE, "checkout"))
    sm.add_transition(StateTransition(EquipmentState.AVAILABLE, EquipmentState.MAINTENANCE, "maintain"))
    sm.add_transition(StateTransition(EquipmentState.AVAILABLE, EquipmentState.RETIRED, "retire"))
    sm.add_transition(StateTransition(EquipmentState.IN_USE, EquipmentState.AVAILABLE, "return"))
    sm.add_transition(StateTransition(EquipmentState.IN_USE, EquipmentState.MAINTENANCE, "report_issue"))
    sm.add_transition(StateTransition(EquipmentState.IN_USE, EquipmentState.RETIRED, "retire"))
    sm.add_transition(StateTransition(EquipmentState.MAINTENANCE, EquipmentState.AVAILABLE, "complete"))
    sm.add_transition(StateTransition(EquipmentState.MAINTENANCE, EquipmentState.RETIRED, "retire"))
    sm.add_transition(StateTransition(EquipmentState.RETIRED, EquipmentState.AVAILABLE, "restore"))

    return sm


notice_sm = create_notice_state_machine()
equipment_sm = create_equipment_state_machine()
