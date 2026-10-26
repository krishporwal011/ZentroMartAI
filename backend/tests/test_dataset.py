"""Dataset loading and relational integrity tests."""
import pytest
from app.core.dataset_loader import dataset_store
from app.services.retrieval import kb_retriever


def test_dataset_tables_loaded():
    assert len(dataset_store.orders) == 1000
    assert len(dataset_store.customers) == 300
    assert len(dataset_store.products) == 70
    assert len(dataset_store.pincodes) == 36
    assert len(dataset_store.holidays) == 4
    assert len(dataset_store.support_logs) == 244
    assert len(dataset_store.practice_questions) == 52
    assert len(dataset_store.practice_conversations) == 96


def test_identifier_types_are_strings():
    for oid, order in list(dataset_store.orders.items())[:50]:
        assert isinstance(oid, str)
        assert isinstance(order["customer_id"], str)
        assert isinstance(order["delivery_pincode"], str)
        assert len(oid) == 8


def test_relational_joins():
    for oid, order in list(dataset_store.orders.items())[:100]:
        cust_id = order["customer_id"]
        assert cust_id in dataset_store.customers, f"Broken customer FK: {cust_id}"
        
        pincode = order["delivery_pincode"]
        assert pincode in dataset_store.pincodes, f"Broken pincode FK: {pincode}"

        items = dataset_store.find_order_items(oid)
        assert len(items) >= 1
        for item in items:
            sku = item["sku"]
            assert sku in dataset_store.products, f"Broken product FK: {sku}"


def test_knowledge_base_ingestion():
    assert len(kb_retriever.sections) >= 30
    assert "RET-2" in kb_retriever.section_by_id
    assert "REF-2" in kb_retriever.section_by_id
    assert "ESC-1" in kb_retriever.section_by_id
    assert "IDV-2" in kb_retriever.section_by_id
