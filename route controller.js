const axios = require("axios");

const getOptimizedRoutes = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: "Please enter source and destination"
      });
    }

    const apiKey = process.env.ORS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "ORS_API_KEY missing in .env file"
      });
    }

    const startGeo = await axios.get(
      "https://api.openrouteservice.org/geocode/search",
      {
        params: {
          api_key: apiKey,
          text: from
        }
      }
    );

    const endGeo = await axios.get(
      "https://api.openrouteservice.org/geocode/search",
      {
        params: {
          api_key: apiKey,
          text: to
        }
      }
    );

    if (!startGeo.data.features.length || !endGeo.data.features.length) {
      return res.status(404).json({
        success: false,
        message: "Source or destination not found"
      });
    }

    const startCoords = startGeo.data.features[0].geometry.coordinates;
    const endCoords = endGeo.data.features[0].geometry.coordinates;

    const routeResponse = await axios.post(
      "https://api.openrouteservice.org/v2/directions/driving-car",
      {
        coordinates: [startCoords, endCoords],
        instructions: true
      },
      {
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json"
        }
      }
    );

    const route = routeResponse.data.routes[0];

    const steps = route.segments[0].steps.map((step) => ({
      instruction: step.instruction,
      distance: (step.distance / 1000).toFixed(2),
      duration: (step.duration / 60).toFixed(2)
    }));

    res.json({
      success: true,
      message: "Real route generated successfully",
      from,
      to,
      startCoords,
      endCoords,
      distanceKm: (route.summary.distance / 1000).toFixed(2),
      durationMin: (route.summary.duration / 60).toFixed(2),
      steps
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "OpenRouteService API error",
      error: error.response?.data || error.message
    });
  }
};

module.exports = { getOptimizedRoutes };
