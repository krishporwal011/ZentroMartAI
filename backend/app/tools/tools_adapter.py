"""Adapter for the supplied mock customer-support tools.

Preserves the security boundaries and exact interface:
- lookup_order(order_id, verification_value=None)
- create_ticket(summary, order_id=None, reason=None, intent=None)
"""
import sys
import os
from pathlib import Path
from typing import Dict, Any, Optional

from app.config import settings

# Add tools directory from dataset to sys.path
dataset_tools_dir = settings.DATASET_DIR / "tools"
if str(dataset_tools_dir) not in sys.path and dataset_tools_dir.exists():
    sys.path.insert(0, str(dataset_tools_dir))

try:
    import tools
    _lookup_order_func = tools.lookup_order
    _create_ticket_func = tools.create_ticket
except ImportError:
    # Fallback to direct import from module path
    import importlib.util
    tools_file = dataset_tools_dir / "tools.py"
    if tools_file.exists():
        spec = importlib.util.spec_from_file_location("tools_module", tools_file)
        tools_mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(tools_mod)
        _lookup_order_func = tools_mod.lookup_order
        _create_ticket_func = tools_mod.create_ticket
    else:
        raise RuntimeError(f"Could not locate tools.py at {tools_file}")


def secure_lookup_order(order_id: str, verification_value: Optional[str] = None) -> Dict[str, Any]:
    """Execute lookup_order through the official mock tool.
    
    If verification_value is None, returns verification_required without order details.
    Only returns order details if verification_value matches phone suffix (4 digits) or delivery pincode (6 digits).
    """
    return _lookup_order_func(order_id, verification_value)


def secure_create_ticket(summary: str, order_id: Optional[str] = None,
                         reason: Optional[str] = None, intent: Optional[str] = None) -> Dict[str, Any]:
    """Execute create_ticket through the official mock tool.
    
    Ticket is created only if summary >= 20 characters.
    """
    return _create_ticket_func(summary=summary, order_id=order_id, reason=reason, intent=intent)
