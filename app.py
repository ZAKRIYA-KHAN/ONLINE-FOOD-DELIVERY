from flask import Flask, render_template, request, jsonify
import datetime

app = Flask(__name__)

# In-memory storage
order_history = []

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/place_order', methods=['POST'])
def place_order():
    data = request.get_json()
    
    # Create ID and Timestamp
    order_id = f"ORD-{len(order_history) + 1001}"
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    new_order = {
        "id": order_id,
        "date": timestamp,
        "customer": data['customerDetails'], # Now includes email/phone
        "cart": data['cart'],
        "total": data['total'],
        "paymentMethod": data['paymentMethod'],
        "paymentDetails": data.get('paymentDetails', {}), # Store card/paypal info
        "status": "Preparing" # Initial status
    }
    
    order_history.append(new_order)
    print(f"Order {order_id} placed.")

    return jsonify({"status": "success", "order_id": order_id})

@app.route('/api/history', methods=['GET'])
def get_history():
    # --- AUTO-UPDATE STATUS LOGIC ---
    # This fixes the issue where history always stays "Preparing"
    now = datetime.datetime.now()
    
    for order in order_history:
        order_dt = datetime.datetime.strptime(order['date'], "%Y-%m-%d %H:%M:%S")
        elapsed_seconds = (now - order_dt).total_seconds()
        
        # Logic: 0-15s = Preparing, 15-30s = Out for Delivery, >30s = Delivered
        if elapsed_seconds > 30:
            order['status'] = "Delivered"
        elif elapsed_seconds > 15:
            order['status'] = "Out for Delivery 🛵"
        else:
            order['status'] = "Preparing 🍳"

    # Return reversed list (newest first)
    return jsonify(order_history[::-1])

if __name__ == '__main__':
    app.run(debug=True)