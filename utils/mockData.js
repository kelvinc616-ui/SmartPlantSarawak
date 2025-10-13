// utils/mockData.js
import plant1 from "../assets/images/plant1.jpg";
import plant2 from "../assets/images/plant2.jpg";

export const mockObservations = [
  {
    id: "1",
    species: "Nepenthes rafflesiana",
    confidence: 0.91,
    location: "Kubah National Park",
    image: plant1, // ✅ no URI
    status: "Verified",
  },
  {
    id: "2",
    species: "Shorea macrophylla",
    confidence: 0.72,
    location: "Semenggoh Nature Reserve",
    image: plant2,
    status: "Flagged",
  },
];
