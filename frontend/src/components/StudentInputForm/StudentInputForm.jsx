import React, { useState } from 'react';
import './StudentInputForm.css';

const StudentInputForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    interests: '',
    hobbies: '',
    favoriteSubjects: '',
    location: '',
    budget: '',
    preferredCountry: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      <h2>Tell us about yourself</h2>

      <label htmlFor="name">Name:</label>
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
      />

      <label htmlFor="interests">Interests:</label>
      <input
        type="text"
        name="interests"
        value={formData.interests}
        onChange={handleChange}
        placeholder="e.g. Technology, Art, Sports"
      />

      <label htmlFor="hobbies">Hobbies:</label>
      <input
        type="text"
        name="hobbies"
        value={formData.hobbies}
        onChange={handleChange}
        placeholder="e.g. Reading, Playing Guitar"
      />

      <label htmlFor="favoriteSubjects">Favorite Subjects:</label>
      <input
        type="text"
        name="favoriteSubjects"
        value={formData.favoriteSubjects}
        onChange={handleChange}
        placeholder="e.g. Math, Chemistry"
      />

      <label htmlFor="location">Location:</label>
      <input
        type="text"
        name="location"
        value={formData.location}
        onChange={handleChange}
        placeholder="City or Region"
      />

      <label htmlFor="budget">Budget (approx.):</label>
      <input
        type="text"
        name="budget"
        value={formData.budget}
        onChange={handleChange}
        placeholder="In your currency"
      />

      <label htmlFor="preferredCountry">Preferred Study Country:</label>
      <input
        type="text"
        name="preferredCountry"
        value={formData.preferredCountry}
        onChange={handleChange}
        placeholder="e.g. India, USA, UK"
      />

      <button type="submit" className="submit-btn">Next</button>
    </form>
  );
};

export default StudentInputForm;
