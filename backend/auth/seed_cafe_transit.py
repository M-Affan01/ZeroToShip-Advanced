import json
from database import SessionLocal
from sqlalchemy import text

db = SessionLocal()

cafe_data = [
    ('cafe-001', 'Avocado Toast Supreme', 'breakfast', 8.99, True, ['vegetarian'], 'Sourdough toast with mashed avocado, cherry tomatoes, and microgreens', 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=800&q=70'),
    ('cafe-002', 'Vegan Power Bowl', 'lunch', 12.99, True, ['vegan', 'gluten-free'], 'Quinoa, roasted vegetables, chickpeas, tahini dressing', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=70'),
    ('cafe-003', 'Caramel Macchiato', 'beverage', 4.99, True, ['vegetarian'], 'Espresso with steamed milk and caramel drizzle', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=70'),
    ('cafe-004', 'Turkey Club Sandwich', 'lunch', 9.99, False, [], 'Roasted turkey, bacon, lettuce, tomato on toasted sourdough', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=70'),
    ('cafe-005', 'Matcha Green Tea Latte', 'beverage', 5.49, True, ['vegan'], 'Ceremonial matcha with oat milk', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=70'),
    ('cafe-006', 'Mediterranean Wrap', 'lunch', 10.49, True, ['vegetarian'], 'Hummus, falafel, fresh vegetables, tahini sauce', 'https://images.unsplash.com/photo-1562059390-a761a084768e?auto=format&fit=crop&w=800&q=70'),
    ('cafe-007', 'Fresh Berry Smoothie', 'beverage', 6.99, True, ['vegan', 'gluten-free'], 'Mixed berries, banana, almond milk, honey', 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=70'),
    ('cafe-008', "Chef's Salad", 'lunch', 11.49, True, ['gluten-free'], 'Mixed greens, grilled chicken, avocado, egg, vinaigrette', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=70'),
    ('cafe-009', 'Chocolate Chip Cookie', 'snack', 2.99, True, ['vegetarian'], 'Freshly baked, soft and chewy', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=70'),
    ('cafe-010', 'Daily Special: Pasta Alfredo', 'special', 13.99, True, ['vegetarian'], 'Creamy alfredo pasta with garlic and parmesan', 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=70'),
]

for item in cafe_data:
    db.execute(text("""INSERT INTO cafe_items (id, name, category, price, available, dietary, description, image_url, created_at, updated_at, version)
        VALUES (:id, :name, :category, :price, :available, :dietary, :description, :image_url, NOW(), NOW(), 1)"""),
        {'id': item[0], 'name': item[1], 'category': item[2], 'price': item[3], 'available': item[4],
         'dietary': json.dumps(item[5]), 'description': item[6], 'image_url': item[7]})

transit_data = [
    ('transit-001', 'Blue Line - Campus Express', 'bus', 'inbound', '2026-08-06T08:45:00', 0, 45, ['Main Campus', 'Science Center', 'Library', 'Student Union'], [], 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=70'),
    ('transit-002', 'Green Line - Downtown Shuttle', 'bus', 'outbound', '2026-08-06T09:00:00', 5, 72, ['Campus Station', 'City Center', 'Shopping District'], ['Traffic delay - 5 minutes behind schedule'], 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=70'),
    ('transit-003', 'Red Line - North Campus', 'bus', 'inbound', '2026-08-06T08:30:00', 0, 30, ['North Dorms', 'Athletics Center', 'Main Campus'], [], 'https://images.unsplash.com/photo-1572025442646-866d16c84a54?auto=format&fit=crop&w=800&q=70'),
    ('transit-004', 'Metro Rail - East/West', 'train', 'inbound', '2026-08-06T08:50:00', 2, 88, ['East Gate', 'University Station', 'West End'], ['Minor delays expected'], 'https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&w=800&q=70'),
    ('transit-005', 'Night Shuttle - South Campus', 'shuttle', 'outbound', '2026-08-06T09:15:00', 0, 15, ['Main Campus', 'South Dorms', 'Graduate Housing'], [], 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=70'),
    ('transit-006', 'Express Shuttle - Parking Lot', 'shuttle', 'inbound', '2026-08-06T08:40:00', 8, 60, ['Lot A', 'Lot B', 'Main Campus', 'Library'], ['Heavy traffic from Lot A - significant delays'], 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=800&q=70'),
]

for item in transit_data:
    db.execute(text("""INSERT INTO transit_items (id, name, type, direction, next_arrival, delay, capacity, route, alerts, image_url, created_at, updated_at, version)
        VALUES (:id, :name, :type, :direction, :next_arrival, :delay, :capacity, :route, :alerts, :image_url, NOW(), NOW(), 1)"""),
        {'id': item[0], 'name': item[1], 'type': item[2], 'direction': item[3], 'next_arrival': item[4],
         'delay': item[5], 'capacity': item[6], 'route': json.dumps(item[7]), 'alerts': json.dumps(item[8]), 'image_url': item[9]})

db.commit()

for table in ['cafe_items', 'transit_items']:
    result = db.execute(text(f'SELECT COUNT(*) FROM {table}'))
    print(f'{table}: {result.scalar()} rows')

db.close()
print('Data seeded!')
