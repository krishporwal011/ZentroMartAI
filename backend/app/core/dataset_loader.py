"""Dataset loader and relational data access layer for ZentroMart."""
from pathlib import Path
from typing import Dict, List, Optional, Set, Any
import csv
import pandas as pd

from app.config import settings


class DatasetStore:
    def __init__(self, dataset_dir: Optional[Path] = None):
        self.dataset_dir = dataset_dir or settings.DATASET_DIR
        self.data_dir = self.dataset_dir / "data"
        self.practice_dir = self.dataset_dir / "practice"
        self.kb_dir = self.dataset_dir / "kb"
        
        # Tables
        self.products: Dict[str, Dict[str, Any]] = {}
        self.customers: Dict[str, Dict[str, Any]] = {}
        self.orders: Dict[str, Dict[str, Any]] = {}
        self.order_items: Dict[str, List[Dict[str, Any]]] = {}
        self.pincodes: Dict[str, Dict[str, Any]] = {}
        self.holidays: Set[str] = set()
        self.holidays_list: List[Dict[str, str]] = []
        self.support_logs: List[Dict[str, Any]] = []
        
        # Practice sets
        self.practice_questions: List[Dict[str, Any]] = []
        self.practice_conversations: List[Dict[str, Any]] = []
        
        # Initialize
        self.reload()

    def _read_csv(self, file_path: Path) -> List[Dict[str, str]]:
        if not file_path.exists():
            raise FileNotFoundError(f"Required dataset file not found: {file_path}")
        with open(file_path, "r", encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            return list(reader)

    def reload(self):
        """Load all CSV files with string preservation for all identifiers."""
        # 1. Products
        prod_rows = self._read_csv(self.data_dir / "products.csv")
        self.products = {r["sku"]: r for r in prod_rows}

        # 2. Customers
        cust_rows = self._read_csv(self.data_dir / "customers.csv")
        self.customers = {r["customer_id"]: r for r in cust_rows}

        # 3. Orders
        order_rows = self._read_csv(self.data_dir / "orders.csv")
        self.orders = {r["order_id"]: r for r in order_rows}

        # 4. Order Items
        item_rows = self._read_csv(self.data_dir / "order_items.csv")
        self.order_items = {}
        for item in item_rows:
            oid = item["order_id"]
            if oid not in self.order_items:
                self.order_items[oid] = []
            self.order_items[oid].append(item)

        # 5. Pincodes
        pin_rows = self._read_csv(self.data_dir / "pincodes.csv")
        self.pincodes = {r["pincode"]: r for r in pin_rows}

        # 6. Holidays
        holiday_rows = self._read_csv(self.data_dir / "holidays.csv")
        self.holidays_list = holiday_rows
        self.holidays = {r["date"] for r in holiday_rows}

        # 7. Support Logs
        self.support_logs = self._read_csv(self.data_dir / "support_logs.csv")

        # 8. Practice Questions
        self.practice_questions = self._read_csv(self.practice_dir / "questions.csv")

        # 9. Practice Conversations
        self.practice_conversations = self._read_csv(self.practice_dir / "conversations.csv")

    def find_product(self, sku: str) -> Optional[Dict[str, Any]]:
        return self.products.get(sku.strip())

    def find_order(self, order_id: str) -> Optional[Dict[str, Any]]:
        clean_id = "".join(ch for ch in str(order_id) if "0" <= ch <= "9")
        return self.orders.get(clean_id)

    def find_order_items(self, order_id: str) -> List[Dict[str, Any]]:
        clean_id = "".join(ch for ch in str(order_id) if "0" <= ch <= "9")
        return self.order_items.get(clean_id, [])

    def find_customer(self, customer_id: str) -> Optional[Dict[str, Any]]:
        return self.customers.get(customer_id.strip())

    def find_pincode(self, pincode: str) -> Optional[Dict[str, Any]]:
        clean_pin = "".join(ch for ch in str(pincode) if "0" <= ch <= "9")
        return self.pincodes.get(clean_pin)

    def get_holidays(self) -> Set[str]:
        return self.holidays


# Global singleton dataset store
dataset_store = DatasetStore()
