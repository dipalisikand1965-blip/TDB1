"""
Test suite for Fulfilment and Reports Admin APIs
Tests the new admin dashboard features for The Doggy Bakery
"""

import pytest
import requests
import os
from datetime import datetime

# Get backend URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pet-os-redesign.preview.emergentagent.com')
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


@pytest.fixture
def auth():
    """Return Basic Auth tuple for admin endpoints"""
    return (ADMIN_USERNAME, ADMIN_PASSWORD)


class TestFulfilmentAPIs:
    """Test Fulfilment Management APIs"""
    
    def test_get_fulfilment_orders_today(self, auth):
        """Test GET /api/admin/fulfilment with today filter"""
        response = requests.get(
            f"{BASE_URL}/api/admin/fulfilment",
            params={"date_range": "today"},
            auth=auth
        )
        assert response.status_code == 200
        data = response.json()
        assert "orders" in data
        assert "count" in data
        assert "status_counts" in data
        assert "statuses" in data
        # Verify status structure
        assert len(data["statuses"]) == 8  # 8 fulfilment statuses
        print(f"✅ Fulfilment today: {data['count']} orders")
    
    def test_get_fulfilment_orders_tomorrow(self, auth):
        """Test GET /api/admin/fulfilment with tomorrow filter"""
        response = requests.get(
            f"{BASE_URL}/api/admin/fulfilment",
            params={"date_range": "tomorrow"},
            auth=auth
        )
        assert response.status_code == 200
        data = response.json()
        assert "orders" in data
        print(f"✅ Fulfilment tomorrow: {data['count']} orders")
    
    def test_get_fulfilment_orders_this_week(self, auth):
        """Test GET /api/admin/fulfilment with this_week filter"""
        response = requests.get(
            f"{BASE_URL}/api/admin/fulfilment",
            params={"date_range": "this_week"},
            auth=auth
        )
        assert response.status_code == 200
        data = response.json()
        assert "orders" in data
        print(f"✅ Fulfilment this week: {data['count']} orders")
    
    def test_get_fulfilment_orders_city_filter(self, auth):
        """Test GET /api/admin/fulfilment with city filter"""
        response = requests.get(
            f"{BASE_URL}/api/admin/fulfilment",
            params={"date_range": "this_month", "city": "Bangalore"},
            auth=auth
        )
        assert response.status_code == 200
        data = response.json()
        assert "orders" in data
        print(f"✅ Fulfilment Bangalore: {data['count']} orders")
    
    def test_get_fulfilment_orders_status_filter(self, auth):
        """Test GET /api/admin/fulfilment with status filter"""
        response = requests.get(
            f"{BASE_URL}/api/admin/fulfilment",
            params={"date_range": "this_month", "status": "pending"},
            auth=auth
        )
        assert response.status_code == 200
        data = response.json()
        assert "orders" in data
        print(f"✅ Fulfilment pending: {data['count']} orders")
    
    def test_get_batch_view_today(self, auth):
        """Test GET /api/admin/fulfilment/batch-view for today"""
        response = requests.get(
            f"{BASE_URL}/api/admin/fulfilment/batch-view",
            params={"date": "today"},
            auth=auth
        )
        assert response.status_code == 200
        data = response.json()
        assert "date" in data
        assert "orders" in data
        assert "summary" in data
        assert "by_time_slot" in data
        assert "by_city" in data
        # Verify summary structure
        summary = data["summary"]
        assert "total_orders" in summary
        assert "autoship_orders" in summary
        assert "custom_orders" in summary
        assert "total_items" in summary
        print(f"✅ Batch view today: {summary['total_orders']} orders, {summary['total_items']} items")
    
    def test_get_batch_view_tomorrow(self, auth):
        """Test GET /api/admin/fulfilment/batch-view for tomorrow"""
        response = requests.get(
            f"{BASE_URL}/api/admin/fulfilment/batch-view",
            params={"date": "tomorrow"},
            auth=auth
        )
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        print(f"✅ Batch view tomorrow: {data['summary']['total_orders']} orders")
    
    def test_get_draft_orders(self, auth):
        """Test GET /api/admin/draft-orders"""
        response = requests.get(
            f"{BASE_URL}/api/admin/draft-orders",
            auth=auth
        )
        assert response.status_code == 200
        data = response.json()
        assert "draft_orders" in data
        assert "count" in data
        print(f"✅ Draft orders: {data['count']} drafts")
    
    def test_fulfilment_requires_auth(self):
        """Test that fulfilment endpoints require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/fulfilment")
        assert response.status_code == 401
        print("✅ Fulfilment requires auth")


class TestReportsAPIs:
    """Test Reports & Analytics APIs"""
    
    def test_executive_summary_today(self, auth):
        """Test GET /api/admin/reports/executive-summary for today"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports/executive-summary",
            params={"period": "today"},
            auth=auth
        )
        assert response.status_code == 200
        data = response.json()
        assert "period" in data
        assert "metrics" in data
        metrics = data["metrics"]
        assert "total_revenue" in metrics
        assert "total_orders" in metrics
        assert "active_autoship_subscribers" in metrics
        assert "repeat_purchase_rate" in metrics
        assert "average_order_value" in metrics
        print(f"✅ Executive summary today: ₹{metrics['total_revenue']} revenue, {metrics['total_orders']} orders")
    
    def test_executive_summary_this_month(self, auth):
        """Test GET /api/admin/reports/executive-summary for this_month"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports/executive-summary",
            params={"period": "this_month"},
            auth=auth
        )
        assert response.status_code == 200
        data = response.json()
        metrics = data["metrics"]
        print(f"✅ Executive summary this month: ₹{metrics['total_revenue']} revenue, AOV: ₹{metrics['average_order_value']}")
    
    def test_revenue_by_city(self, auth):
        """Test GET /api/admin/reports/revenue-by-city"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports/revenue-by-city",
            auth=auth
        )
        assert response.status_code == 200
        data = response.json()
        assert "by_city" in data
        assert "total_revenue" in data
        assert "total_orders" in data
        # Verify city data structure
        if data["by_city"]:
            city = data["by_city"][0]
            assert "city" in city
            assert "revenue" in city
            assert "orders" in city
            assert "avg_order_value" in city
        print(f"✅ Revenue by city: {len(data['by_city'])} cities, ₹{data['total_revenue']} total")
    
    def test_daily_sales(self, auth):
        """Test GET /api/admin/reports/daily-sales"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports/daily-sales",
            params={"days": 7},
            auth=auth
        )
        assert response.status_code == 200
        data = response.json()
        assert "period" in data
        assert "daily_sales" in data
        # Verify daily sales structure
        if data["daily_sales"]:
            day = data["daily_sales"][0]
            assert "date" in day
            assert "revenue" in day
            assert "orders" in day
            assert "autoship_orders" in day
        print(f"✅ Daily sales: {len(data['daily_sales'])} days of data")
    
    def test_daily_sales_with_city_filter(self, auth):
        """Test GET /api/admin/reports/daily-sales with city filter"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports/daily-sales",
            params={"days": 30, "city": "Bangalore"},
            auth=auth
        )
        assert response.status_code == 200
        data = response.json()
        assert data["city_filter"] == "Bangalore"
        print(f"✅ Daily sales Bangalore: {len(data['daily_sales'])} days")
    
    def test_product_performance(self, auth):
        """Test GET /api/admin/reports/product-performance"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports/product-performance",
            params={"days": 30},
            auth=auth
        )
        assert response.status_code == 200
        data = response.json()
        assert "period" in data
        assert "top_products" in data
        # Verify product structure
        if data["top_products"]:
            product = data["top_products"][0]
            assert "product" in product
            assert "quantity_sold" in product
            assert "revenue" in product
            assert "orders" in product
            assert "autoship_count" in product
        print(f"✅ Product performance: {len(data['top_products'])} top products")
    
    def test_autoship_performance(self, auth):
        """Test GET /api/admin/reports/autoship-performance"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports/autoship-performance",
            auth=auth
        )
        assert response.status_code == 200
        data = response.json()
        assert "subscribers" in data
        subscribers = data["subscribers"]
        assert "active" in subscribers
        assert "paused" in subscribers
        assert "cancelled" in subscribers
        assert "total" in subscribers
        assert "revenue_30d" in data
        assert "by_frequency" in data
        assert "churn_rate" in data
        assert "retention_rate" in data
        print(f"✅ Autoship: {subscribers['active']} active, {subscribers['paused']} paused, {data['retention_rate']}% retention")
    
    def test_customer_intelligence(self, auth):
        """Test GET /api/admin/reports/customer-intelligence"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports/customer-intelligence",
            params={"days": 90},
            auth=auth
        )
        assert response.status_code == 200
        data = response.json()
        assert "period" in data
        assert "new_customers" in data
        assert "returning_customers" in data
        assert "inactive_customers_60d" in data
        assert "average_order_value" in data
        assert "high_value_customers" in data
        print(f"✅ Customer intelligence: {data['new_customers']} new, {data['returning_customers']} returning")
    
    def test_pet_intelligence(self, auth):
        """Test GET /api/admin/reports/pet-intelligence"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports/pet-intelligence",
            auth=auth
        )
        assert response.status_code == 200
        data = response.json()
        assert "popular_breeds" in data
        assert "total_pets" in data
        assert "upcoming_birthdays" in data
        birthdays = data["upcoming_birthdays"]
        assert "next_7_days" in birthdays
        assert "next_14_days" in birthdays
        assert "next_30_days" in birthdays
        print(f"✅ Pet intelligence: {data['total_pets']} pets, {len(data['popular_breeds'])} breeds")
    
    def test_operations_report(self, auth):
        """Test GET /api/admin/reports/operations"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports/operations",
            auth=auth
        )
        assert response.status_code == 200
        data = response.json()
        assert "orders_by_status" in data
        assert "upcoming_autoship_shipments_7d" in data
        assert "fulfilment_statuses" in data
        print(f"✅ Operations: {len(data['orders_by_status'])} status groups, {data['upcoming_autoship_shipments_7d']} upcoming autoships")
    
    def test_reviews_report(self, auth):
        """Test GET /api/admin/reports/reviews"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports/reviews",
            auth=auth
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_reviews" in data
        assert "pending_approval" in data
        assert "approved" in data
        assert "average_rating" in data
        assert "low_rated_products" in data
        print(f"✅ Reviews: {data['total_reviews']} total, {data['pending_approval']} pending, avg rating: {data['average_rating']}")
    
    def test_financial_report(self, auth):
        """Test GET /api/admin/reports/financial"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports/financial",
            params={"days": 30},
            auth=auth
        )
        assert response.status_code == 200
        data = response.json()
        assert "period" in data
        assert "total_discounts_given" in data
        assert "total_shipping_revenue" in data
        assert "total_revenue" in data
        assert "cancelled_orders" in data
        assert "discount_impact_percent" in data
        print(f"✅ Financial: ₹{data['total_revenue']} revenue, ₹{data['total_discounts_given']} discounts, {data['discount_impact_percent']}% impact")
    
    def test_reports_require_auth(self):
        """Test that report endpoints require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/reports/executive-summary")
        assert response.status_code == 401
        print("✅ Reports require auth")


class TestSearchService:
    """Test Meilisearch Search Service"""
    
    def test_search_stats(self):
        """Test GET /api/search/stats"""
        response = requests.get(f"{BASE_URL}/api/search/stats")
        assert response.status_code == 200
        data = response.json()
        assert "initialized" in data
        if data["initialized"]:
            assert "products_indexed" in data
            print(f"✅ Search stats: {data['products_indexed']} products indexed")
        else:
            print("⚠️ Search service not initialized")
    
    def test_typeahead_search(self):
        """Test GET /api/search/typeahead"""
        response = requests.get(
            f"{BASE_URL}/api/search/typeahead",
            params={"q": "cake", "limit": 5}
        )
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert "collections" in data
        assert "query" in data
        print(f"✅ Typeahead 'cake': {len(data['products'])} products, {len(data['collections'])} collections")
    
    def test_full_search(self):
        """Test GET /api/search"""
        response = requests.get(
            f"{BASE_URL}/api/search",
            params={"q": "birthday", "limit": 10}
        )
        assert response.status_code == 200
        data = response.json()
        assert "hits" in data
        assert "query" in data
        print(f"✅ Full search 'birthday': {len(data['hits'])} results")
    
    def test_reindex_requires_auth(self):
        """Test POST /api/search/reindex requires auth"""
        response = requests.post(f"{BASE_URL}/api/search/reindex")
        assert response.status_code == 401
        print("✅ Reindex requires auth")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
