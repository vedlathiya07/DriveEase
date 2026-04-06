import { useState } from "react";
import API from "../services/api";

export default function AddCar() {
  const [form, setForm] = useState({
    title: "",
    pricePerDay: "",
    location: "",
    fuelType: "Petrol",
  });

  const [images, setImages] = useState([]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();

    Object.keys(form).forEach((key) => {
      data.append(key, form[key]);
    });

    data.append("type", "car");

    for (let i = 0; i < images.length; i++) {
      data.append("images", images[i]);
    }

    try {
      await API.post("/cars", data);
      alert("Car added 🚗");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Add Car 🚗</h2>

      <form onSubmit={handleSubmit} className="card p-4">
        <input
          type="text"
          name="title"
          placeholder="Car Name"
          className="form-control mb-3"
          onChange={handleChange}
        />

        <input
          type="number"
          name="pricePerDay"
          placeholder="Price"
          className="form-control mb-3"
          onChange={handleChange}
        />

        <input
          type="text"
          name="location"
          placeholder="Location"
          className="form-control mb-3"
          onChange={handleChange}
        />

        <select
          name="fuelType"
          className="form-select mb-3"
          onChange={handleChange}
        >
          <option>Petrol</option>
          <option>Diesel</option>
          <option>Electric</option>
        </select>

        <input
          type="file"
          multiple
          className="form-control mb-3"
          onChange={(e) => setImages(e.target.files)}
        />

        <button className="btn btn-primary">Add Car</button>
      </form>
    </div>
  );
}
