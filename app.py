from flask import Flask, render_template, jsonify, request, session, redirect, url_for
import firebase_admin
from firebase_admin import credentials, firestore
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from zoneinfo import ZoneInfo
import hashlib
import os


app = Flask(__name__)

# ==========================================
# FLASK SESSION
# ==========================================

app.secret_key = os.environ.get(
    "ECOTRACK_SECRET_KEY",
    "ecotrack-local-secret-key-change-this"
)


# ==========================================
# FIREBASE CONNECTION
# ==========================================
firebase_key_path = os.environ.get(
    "GOOGLE_APPLICATION_CREDENTIALS",
    "serviceAccountKey.json"
)

cred = credentials.Certificate(firebase_key_path)

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()


# ==========================================
# ABOUT PAGE
# ==========================================

@app.route("/about")
def about():
    return render_template("about.html")


# ==========================================
# HOME PAGE
# ==========================================

@app.route("/")
def home():
    return render_template("index.html")


# ==========================================
# DASHBOARD PAGE
# ==========================================

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")
# ==========================================
# PROFILE PAGE
# ==========================================

@app.route("/profile")
def profile_page():

    if "user_id" not in session:
        return redirect(url_for("login_page"))

    return render_template("profile.html")
# ==========================================

# ==========================================
# GET USER ECO HISTORY
# ==========================================

@app.route("/api/eco-history", methods=["GET"])
def get_eco_history():

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "User not logged in."
        }), 401

    user_id = session["user_id"]

    history_ref = (
        db.collection("users")
        .document(user_id)
        .collection("eco_history")
        .order_by("created_at", direction=firestore.Query.DESCENDING)
    )

    grouped = {}

    for doc in history_ref.stream():
        item = doc.to_dict() or {}
        created_at = item.get("created_at")

        date_text = item.get("date")
        if not date_text and created_at:
            date_text = created_at.strftime("%Y-%m-%d")
        if not date_text:
            date_text = "Unknown date"

        if date_text not in grouped:
            grouped[date_text] = {
                "date": date_text,
                "carbon": None,
                "ecoScore": None,
                "eco_score": None,
                "ecoPoints": item.get("eco_points")
            }

        current = grouped[date_text]

        # Newest non-empty values are retained; older records fill blanks.
        carbon_value = item.get("carbon")
        if current["carbon"] is None and carbon_value is not None:
            current["carbon"] = carbon_value

        score_value = item.get("eco_score", item.get("ecoScore"))
        if current["ecoScore"] is None and score_value is not None:
            current["ecoScore"] = score_value
            current["eco_score"] = score_value

        if current["ecoPoints"] is None and item.get("eco_points") is not None:
            current["ecoPoints"] = item.get("eco_points")

    history = sorted(
        grouped.values(),
        key=lambda row: row["date"],
        reverse=True
    )

    return jsonify({
        "success": True,
        "history": history
    })

# HISTORY PAGE
# ==========================================

@app.route("/history")
def history_page():

    if "user_id" not in session:
        return redirect(url_for("login_page"))

    return render_template("history.html")


# ==========================================
# SETTINGS PAGE
# ==========================================

@app.route("/settings")
def settings_page():

    if "user_id" not in session:
        return redirect(url_for("login_page"))

    return render_template("settings.html")

# ==========================================
# REGISTER PAGE
# ==========================================

@app.route("/register")
def register_page():

    if "user_id" in session:
        return redirect(url_for("home"))

    return render_template("register.html")


# ==========================================
# LOGIN PAGE
# ==========================================

@app.route("/login")
def login_page():

    if "user_id" in session:
        return redirect(url_for("home"))

    return render_template("login.html")


# ==========================================
# REGISTER API
# ==========================================

@app.route("/api/register", methods=["POST"])
def register():

    data = request.get_json() or {}

    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    confirm_password = str(data.get("confirm_password", ""))

    # -------------------------------
    # VALIDATION
    # -------------------------------

    if not name:
        return jsonify({
            "success": False,
            "message": "Please enter your full name."
        }), 400

    if not email:
        return jsonify({
            "success": False,
            "message": "Please enter your email."
        }), 400

    if not password:
        return jsonify({
            "success": False,
            "message": "Please enter a password."
        }), 400

    if len(password) < 6:
        return jsonify({
            "success": False,
            "message": "Password must be at least 6 characters."
        }), 400

    if password != confirm_password:
        return jsonify({
            "success": False,
            "message": "Passwords do not match."
        }), 400

    # -------------------------------
    # CHECK EXISTING USER
    # -------------------------------

    existing_users = (
        db.collection("users")
        .where("email", "==", email)
        .limit(1)
        .stream()
    )

    for user in existing_users:
        return jsonify({
            "success": False,
            "message": "An account with this email already exists."
        }), 409

    # -------------------------------
    # CREATE USER ID
    # -------------------------------

    user_id = hashlib.sha256(
        email.encode("utf-8")
    ).hexdigest()

    # -------------------------------
    # HASH PASSWORD
    # -------------------------------

    password_hash = generate_password_hash(password)

    # -------------------------------
    # SAVE USER TO FIREBASE
    # -------------------------------

    db.collection("users").document(user_id).set({

        "name": name,
        "email": email,
        "password_hash": password_hash,

        "created_at": firestore.SERVER_TIMESTAMP,

        "eco_points": 0,
        "eco_score": 0,

        "profile_completed": False

    })

    # -------------------------------
    # LOGIN USER AUTOMATICALLY
    # -------------------------------

    session["user_id"] = user_id
    session["user_name"] = name
    session["user_email"] = email

    return jsonify({
        "success": True,
        "message": "Account created successfully!",
        "name": name
    })


# ==========================================
# LOGIN API
# ==========================================

@app.route("/api/login", methods=["POST"])
def login():

    data = request.get_json() or {}

    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not email or not password:
        return jsonify({
            "success": False,
            "message": "Please enter email and password."
        }), 400

    # -------------------------------
    # FIND USER
    # -------------------------------

    users = (
        db.collection("users")
        .where("email", "==", email)
        .limit(1)
        .stream()
    )

    user_data = None
    user_id = None

    for user in users:
        user_id = user.id
        user_data = user.to_dict()
        break

    if not user_data:
        return jsonify({
            "success": False,
            "message": "No account found with this email."
        }), 401

    # -------------------------------
    # CHECK PASSWORD
    # -------------------------------

    stored_hash = user_data.get("password_hash", "")

    if not check_password_hash(stored_hash, password):
        return jsonify({
            "success": False,
            "message": "Incorrect password."
        }), 401

    # -------------------------------
    # CREATE LOGIN SESSION
    # -------------------------------

    session["user_id"] = user_id
    session["user_name"] = user_data.get("name", "")
    session["user_email"] = user_data.get("email", "")

    return jsonify({
        "success": True,
        "message": "Login successful!",
        "name": user_data.get("name", "")
    })


# ==========================================
# LOGOUT
# ==========================================

@app.route("/logout")
def logout():

    session.clear()

    return redirect(url_for("home"))


# ==========================================
# CURRENT USER
# ==========================================

@app.route("/api/auth/me")
def current_user():

    if "user_id" not in session:
        return jsonify({
            "logged_in": False
        })

    user_id = session.get("user_id")

    user_ref = db.collection("users").document(user_id)
    user_doc = user_ref.get()

    if user_doc.exists:

        user_data = user_doc.to_dict()

        return jsonify({
            "logged_in": True,
            "user": {
                "id": user_id,
                "name": user_data.get("name", session.get("user_name", "")),
                "email": user_data.get("email", session.get("user_email", "")),
                "eco_points": user_data.get("eco_points", 0),
                "eco_score": user_data.get("eco_score", 0)
            }
        })

    return jsonify({
        "logged_in": True,
        "user": {
            "id": user_id,
            "name": session.get("user_name", ""),
            "email": session.get("user_email", ""),
            "eco_points": 0,
            "eco_score": 0
        }
    })
# ==========================================
# SAVE USER ECO DATA
# ==========================================


@app.route("/api/save-eco-data", methods=["POST"])
def save_eco_data():

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    data = request.get_json() or {}
    user_id = session["user_id"]

    try:
        eco_score = int(float(data.get("eco_score", 0) or 0))
    except (ValueError, TypeError):
        eco_score = 0

    eco_score = max(0, min(100, eco_score))

    carbon = data.get("carbon")
    try:
        carbon = float(carbon) if carbon is not None else None
    except (ValueError, TypeError):
        carbon = None

    user_ref = db.collection("users").document(user_id)
    user_ref.update({"eco_score": eco_score})

    user_doc = user_ref.get()
    user_data = user_doc.to_dict() if user_doc.exists else {}
    current_eco_points = int(user_data.get("eco_points", 0) or 0)

    india_now = datetime.now(ZoneInfo("Asia/Kolkata"))
    history_date = india_now.strftime("%Y-%m-%d")

    history_ref = (
        db.collection("users")
        .document(user_id)
        .collection("eco_history")
        .document(history_date)
    )

    old_doc = history_ref.get()
    old_data = old_doc.to_dict() if old_doc.exists else {}

    # Do not overwrite an existing carbon value with null.
    if carbon is None:
        carbon = old_data.get("carbon")

    history_ref.set({
        "date": history_date,
        "eco_score": eco_score,
        "eco_points": current_eco_points,
        "carbon": carbon,
        "created_at": firestore.SERVER_TIMESTAMP
    }, merge=True)

    return jsonify({
        "success": True,
        "message": "Eco data and history saved successfully!",
        "eco_score": eco_score,
        "eco_points": current_eco_points,
        "carbon": carbon
    })

# ADD GAMIFICATION ECOPOINTS
# ==========================================

@app.route("/api/add-ecopoints", methods=["POST"])
def add_ecopoints():

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    data = request.get_json() or {}

    try:
        points = int(data.get("points", 0) or 0)
    except (ValueError, TypeError):
        points = 0

    if points <= 0:
        return jsonify({
            "success": False,
            "message": "Invalid EcoPoints."
        }), 400

    user_id = session.get("user_id")

    user_ref = db.collection("users").document(user_id)

    # Atomically ADD gamification points
    user_ref.update({
        "eco_points": firestore.Increment(points)
    })

    # Get updated points
    user_doc = user_ref.get()
    user_data = user_doc.to_dict() if user_doc.exists else {}

    total_points = int(
        user_data.get("eco_points", 0) or 0
    )

    return jsonify({
        "success": True,
        "message": "Gamification EcoPoints added successfully!",
        "added_points": points,
        "eco_points": total_points
    })


# ==========================================
# FIREBASE TEST
# ==========================================

@app.route("/api/test-firebase", methods=["POST"])
def test_firebase():

    data = request.get_json() or {}

    doc_ref = db.collection("ecotrack_test").document()

    doc_ref.set({
        "message": data.get("message", "Hello EcoTrack"),
        "created": firestore.SERVER_TIMESTAMP
    })

    return jsonify({
        "message": "Data saved to Firebase successfully!",
        "document_id": doc_ref.id
    })


# ==========================================
# SAVE ECO PROFILE
# ==========================================

@app.route("/api/profile", methods=["POST"])
def save_profile():

    data = request.get_json() or {}

    doc_data = {
        "transportation": data.get("transportation"),
        "electricity": data.get("electricity"),
        "food": data.get("food"),
        "shopping": data.get("shopping"),
        "home_energy": data.get("home_energy"),
        "travel": data.get("travel"),
        "created": firestore.SERVER_TIMESTAMP
    }

    # Save user ID if logged in
    if "user_id" in session:
        doc_data["user_id"] = session["user_id"]
        doc_data["user_email"] = session.get("user_email")

    doc_ref = db.collection("eco_profiles").document()

    doc_ref.set(doc_data)

    return jsonify({
        "success": True,
        "message": "Eco profile saved successfully!",
        "document_id": doc_ref.id
    })


# ==========================================
# CALCULATE CARBON FOOTPRINT
# ==========================================

@app.route("/api/calculate", methods=["POST"])
def calculate():

    data = request.get_json() or {}

    transportation = float(data.get("transportation", 0) or 0)
    electricity = float(data.get("electricity", 0) or 0)
    food = float(data.get("food", 0) or 0)
    shopping = float(data.get("shopping", 0) or 0)
    home_energy = float(data.get("home_energy", 0) or 0)
    travel = float(data.get("travel", 0) or 0)

    # Simple V1 estimation
    transport_co2 = transportation * 0.21
    electricity_co2 = electricity * 0.82
    food_co2 = food * 1.5
    shopping_co2 = shopping * 0.02
    home_co2 = home_energy * 0.4
    travel_co2 = travel * 0.25

    total = (
        transport_co2
        + electricity_co2
        + food_co2
        + shopping_co2
        + home_co2
        + travel_co2
    )

    # -------------------------------
    # SAVE RESULT TO FIREBASE
    # -------------------------------

    doc_data = {
        "transportation": transportation,
        "electricity": electricity,
        "food": food,
        "shopping": shopping,
        "home_energy": home_energy,
        "travel": travel,
        "carbon_footprint": round(total, 2),
        "created": firestore.SERVER_TIMESTAMP
    }

    # Attach result to logged-in user
    if "user_id" in session:
        doc_data["user_id"] = session["user_id"]
        doc_data["user_email"] = session.get("user_email")

    doc_ref = db.collection("carbon_calculations").document()

    doc_ref.set(doc_data)

    return jsonify({
        "success": True,
        "carbon_footprint": round(total, 2),
        "breakdown": {
            "transportation": round(transport_co2, 2),
            "electricity": round(electricity_co2, 2),
            "food": round(food_co2, 2),
            "shopping": round(shopping_co2, 2),
            "home_energy": round(home_co2, 2),
            "travel": round(travel_co2, 2)
        }
    })


# ==========================================
# RECOMMENDATIONS
# ==========================================

@app.route("/api/recommendations", methods=["POST"])
def recommendations():

    data = request.get_json() or {}

    recommendations_list = []

    transportation = float(data.get("transportation", 0) or 0)
    electricity = float(data.get("electricity", 0) or 0)
    food = float(data.get("food", 0) or 0)
    shopping = float(data.get("shopping", 0) or 0)
    home_energy = float(data.get("home_energy", 0) or 0)
    travel = float(data.get("travel", 0) or 0)

    if transportation > 10:
        recommendations_list.append(
            "ðŸš† Try public transport, cycling, walking, or carpooling."
        )

    if electricity > 10:
        recommendations_list.append(
            "ðŸ’¡ Reduce electricity usage and switch to energy-efficient appliances."
        )

    if food > 10:
        recommendations_list.append(
            "ðŸ¥— Reduce food waste and include more plant-based meals."
        )

    if shopping > 500:
        recommendations_list.append(
            "ðŸ›ï¸ Reduce unnecessary purchases and choose reusable products."
        )

    if home_energy > 10:
        recommendations_list.append(
            "ðŸ  Improve home energy efficiency and avoid unnecessary heating/cooling."
        )

    if travel > 5:
        recommendations_list.append(
            "âœˆï¸ Consider fewer flights or choose lower-carbon travel options."
        )

    if not recommendations_list:
        recommendations_list.append(
            "ðŸŒ± Great job! Your current habits look relatively eco-friendly."
        )

    return jsonify({
        "success": True,
        "recommendations": recommendations_list
    })

# ==========================================
# SAVE USER ECO STATS + HISTORY
# ==========================================


@app.route("/api/user/stats", methods=["POST"])
def save_user_stats():

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "User not logged in."
        }), 401

    data = request.get_json() or {}

    try:
        eco_score = int(float(data.get("eco_score", 0) or 0))
    except (ValueError, TypeError):
        eco_score = 0

    eco_score = max(0, min(100, eco_score))

    carbon = data.get("carbon")
    try:
        carbon = float(carbon) if carbon is not None else None
    except (ValueError, TypeError):
        carbon = None

    user_id = session["user_id"]
    user_ref = db.collection("users").document(user_id)

    user_doc = user_ref.get()
    user_data = user_doc.to_dict() if user_doc.exists else {}
    current_eco_points = int(user_data.get("eco_points", 0) or 0)

    user_ref.update({"eco_score": eco_score})

    india_now = datetime.now(ZoneInfo("Asia/Kolkata"))
    history_date = india_now.strftime("%Y-%m-%d")

    history_ref = (
        db.collection("users")
        .document(user_id)
        .collection("eco_history")
        .document(history_date)
    )

    old_doc = history_ref.get()
    old_data = old_doc.to_dict() if old_doc.exists else {}

    if carbon is None:
        carbon = old_data.get("carbon")

    history_ref.set({
        "date": history_date,
        "eco_score": eco_score,
        "eco_points": current_eco_points,
        "carbon": carbon,
        "created_at": firestore.SERVER_TIMESTAMP
    }, merge=True)

    return jsonify({
        "success": True,
        "eco_score": eco_score,
        "eco_points": current_eco_points,
        "carbon": carbon,
        "message": "Eco stats and history saved successfully!"
    })

# SERVER
# ==========================================

if __name__ == "__main__":

    app.run(
        debug=True,
        host="127.0.0.1",
        port=5000
    )
