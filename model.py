def predict_route(data):
    distance = float(data["distanceKm"])
    duration = float(data["durationMin"])
    aqi = float(data["aqi"])
    traffic = float(data["traffic"])
    mode = data["mode"]

    if mode == "foot-walking":
        fuel_cost = 0
        co2 = 0
    elif mode == "cycling-regular":
        fuel_cost = round((distance / 45) * 95)
        co2 = round(distance * 0.03, 2)
    else:
        fuel_cost = round((distance / 18) * 95)
        co2 = round(distance * 0.12, 2)

    safety_score = 100 - (traffic * 0.35) - (aqi * 0.20)
    safety_score = max(0, round(safety_score, 1))

    route_score = (
        100
        - distance * 0.25
        - duration * 0.15
        - aqi * 0.15
        - traffic * 0.25
    )
    route_score = max(0, round(route_score, 1))

    if route_score >= 75:
        recommendation = "Excellent route. Low risk and efficient travel."
    elif route_score >= 50:
        recommendation = "Good route, but traffic or AQI may affect travel."
    else:
        recommendation = "Avoid if possible. Try an alternative route."

    return {
        "safetyScore": safety_score,
        "routeScore": route_score,
        "fuelCost": fuel_cost,
        "co2": co2,
        "recommendation": recommendation
    }
