// Star animation
const canvas = document.getElementById("spaceBackground")
const ctx = canvas.getContext("2d")

let width = (canvas.width = window.innerWidth)
let height = (canvas.height = window.innerHeight)

const starCount = 200
const speed = 0.01

class Star {
  constructor() {
    this.x = Math.random() * 2 - 1
    this.y = Math.random() * 2 - 1
    this.z = Math.random()
    this.pz = 0
  }

  update() {
    this.z -= speed
    if (this.z <= 0) {
      this.z = 1
      this.pz = 0
    }
  }

  draw() {
    const x = (this.x * width) / this.z + width / 2
    const y = (this.y * height) / this.z + height / 2
    const r = 1.5 * (1 - this.z)

    ctx.beginPath()
    ctx.arc(x, y, r, 0, 2 * Math.PI)
    ctx.fill()

    if (this.pz > 0) {
      ctx.beginPath()
      ctx.moveTo(x, y)
      const px = (this.x * width) / this.pz + width / 2
      const py = (this.y * height) / this.pz + height / 2
      ctx.lineTo(px, py)
      ctx.stroke()
    }

    this.pz = this.z
  }
}

const stars = Array.from({ length: starCount }, () => new Star())

function animate() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = "white"
  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"
  ctx.lineWidth = 0.5

  stars.forEach((star) => {
    star.update()
    star.draw()
  })

  requestAnimationFrame(animate)
}

function handleResize() {
  width = canvas.width = window.innerWidth
  height = canvas.height = window.innerHeight
}

window.addEventListener("resize", handleResize)
animate()

// Event handling
const allEventsBtn = document.getElementById("allEventsBtn")
const recommendedEventsBtn = document.getElementById("recommendedEventsBtn")
const allEventsSection = document.getElementById("allEvents")
const recommendedSection = document.getElementById("recommended")

// Show All Events section by default
allEventsSection.classList.remove("hidden")
recommendedSection.classList.add("hidden")

allEventsBtn.addEventListener("click", () => {
  allEventsBtn.classList.add("bg-blue-600")
  allEventsBtn.classList.remove("bg-gray-700")
  recommendedEventsBtn.classList.add("bg-gray-700")
  recommendedEventsBtn.classList.remove("bg-blue-600")
  
  // Show All Events section and hide Recommended section
  allEventsSection.classList.remove("hidden")
  recommendedSection.classList.add("hidden")
})

recommendedEventsBtn.addEventListener("click", () => {
  recommendedEventsBtn.classList.add("bg-blue-600")
  recommendedEventsBtn.classList.remove("bg-gray-700")
  allEventsBtn.classList.add("bg-gray-700")
  allEventsBtn.classList.remove("bg-blue-600")
  
  // Show Recommended section and hide All Events section
  recommendedSection.classList.remove("hidden")
  allEventsSection.classList.add("hidden")
})

// Function to format prediction result
const recommendationPhrases = [
  "🌟 Unlock your potential with this perfect match:",
  "✨ We've found your next learning adventure:",
  "🎯 Based on your interests, here's an exciting opportunity:",
  "🚀 Level up your skills with this recommendation:",
  "💡 Here's an event that aligns with your goals:",
  "🎓 Transform your journey with this perfect fit:",
  "⭐ We've discovered the ideal learning path for you:",
  "🌈 Your next success story begins with:",
];

function formatPredictionResult(result) {
  const randomPhrase = recommendationPhrases[Math.floor(Math.random() * recommendationPhrases.length)];
  return `
      <div class="prediction-result">
          <p class="recommendation-phrase">${randomPhrase}</p>
          <div class="prediction-details">
              ${JSON.stringify(result, null, 2)}
          </div>
      </div>
  `;
}

// Function to fetch token
async function fetchToken() {
  try {
    const response = await fetch('http://localhost:3000/get-token');
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || errorData.message || 'Failed to fetch token from server');
    }
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Detailed token error:', error);
    return null;
  }
}

// Function to make prediction
async function makePrediction(formData) {
  try {
    const token = await fetchToken();
    if (!token) {
      alert('Unable to fetch access token. Please check the console for details.');
      return;
    }

    const scoringUrl = 'http://localhost:3000/recommend';
    const payload = {
      input_data: [
        {
          fields: [
            "User Interests",
            "Mode",
            "Budget (₹)",
            "Event Category",
            "Price (₹)",
            "Duration (Hours)",
            "Trending",
            "Certificate Offered"
          ],
          values: [
            [
              formData.userInterests,
              formData.mode,
              parseInt(formData.budget),
              formData.eventCategory,
              parseInt(formData.price),
              parseInt(formData.duration),
              formData.trending,
              formData.certificateOffered
            ]
          ]
        }
      ]
    };

    const response = await fetch(scoringUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    const result = await response.json();

    // Extract and display workshop names from the result
    const workshopNames = result.predictions[0].values.map(value => value[0]); // Assuming the workshop name is the first field
    const formattedResult = workshopNames[0]; // Get the first workshop name

    // Create a card for the recommended workshop
    const recommendedCard = document.createElement('div');
    recommendedCard.className = 'event-card bg-gradient-to-r ' + getRandomColor() + ' p-4 rounded-lg shadow-lg';
    recommendedCard.innerHTML = `
        <h3 class="text-xl font-bold text-white text-left">${formattedResult}</h3>
        <p class="text-gray-200 text-left">Date: 2023-10-${Math.floor(Math.random() * 30 + 1)}</p>
        <p class="text-gray-200 text-left">Time: ${Math.floor(Math.random() * 12 + 1)}:00 AM</p>
        <p class="text-gray-200 text-left">Venue: Main Hall</p>
        <button class="apply-button mt-4 px-4 py-2 rounded">Apply Now</button>
    `;

    // Insert the card into the recommended section
    const recommendedContainer = document.getElementById('recommended');
    const eventsContainer = recommendedContainer.querySelector('.form-container');
    eventsContainer.appendChild(recommendedCard);

  } catch (error) {
    console.error('Detailed prediction error:', error);
    alert('Error making prediction: ' + error.message);
  }
}

// Form submission handler
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('predictionForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
      userInterests: document.getElementById('userInterests').value,
      mode: document.getElementById('mode').value,
      budget: document.getElementById('budget').value,
      eventCategory: document.getElementById('eventCategory').value,
      price: document.getElementById('price').value,
      duration: document.getElementById('duration').value,
      trending: document.getElementById('trending').checked,
      certificateOffered: document.getElementById('certificateOffered').checked
    };

    await makePrediction(formData);

    // Show the recommended section
    const recommendedSection = document.getElementById('recommended');
    recommendedSection.classList.remove('hidden');
  });
});

// Array of workshop names
const workshopNames = [
    "Introduction to Data Science",
    "Trends in Digital Marketing",
    "Full-Stack Web Development",
    "Workshop on Artificial Intelligence",
    "Bootcamp on Software Engineering",
    "Agile BA Bootcamp",
    "The Future of Web Development",
    "Bootcamp on Mobile App Development",
    "Leadership Trends for the 21st Century",
    "Course on Artificial Intelligence",
    "Executive Business Analysis Workshop",
    "Foundations of Leadership",
    "Seminar on Mobile App Development",
    "Workshop on Mobile App Development",
    "Bootcamp on Soft Skills",
    "Cybersecurity Trends and Challenges",
    "Seminar on Cloud Computing",
    "Bootcamp on Networking",
    "Workshop on Soft Skills",
    "SEO Bootcamp",
    "Workshop on Project Management",
    "Executive Leadership Strategies",
    "Responsive Design Workshop",
    "Business Analysis in the Digital Age",
    "Workshop on Cloud Computing",
    "Course on Mobile App Development",
    "Big Data Engineering Bootcamp",
    "Bootcamp on UI/UX Design",
];

// Function to generate a random gradient color
function getRandomColor() {
    const colors = [
        'from-blue-500 to-purple-500',
        'from-green-500 to-yellow-500',
        'from-red-500 to-orange-500',
        'from-pink-500 to-red-500',
        'from-teal-500 to-blue-500',
        'from-indigo-500 to-purple-600',
        'from-yellow-400 to-red-500',
        'from-gray-500 to-gray-700',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Function to create event cards
function createEventCards() {
    const eventRowContainers = document.querySelectorAll('.event-row');
    for (let row = 0; row < eventRowContainers.length; row++) {
        for (let i = 0; i < 10; i++) { // 10 cards per row
            const card = document.createElement('div');
            card.className = `event-card bg-gradient-to-r ${getRandomColor()} hover:scale-105 transition-transform duration-300 p-4 rounded-lg shadow-lg`;
            card.innerHTML = `
                <h3 class="text-xl font-bold text-white text-left">${workshopNames[row * 10 + i]}</h3>
                <p class="text-gray-200 text-left">Date: 2023-10-${(row * 10 + i) % 30 + 1}</p>
                <p class="text-gray-200 text-left">Time: ${10 + ((row * 10 + i) % 12)}:00 AM</p>
                <p class="text-gray-200 text-left">Venue: Main Hall</p>
                <button class="apply-button mt-4 px-4 py-2 rounded">Apply Now</button>
            `;
            eventRowContainers[row].appendChild(card);
        }
    }
}

// Call the function to create cards when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', createEventCards);

// Function to scroll the event row to the right
function scrollRight(event) {
    const row = event.target.previousElementSibling; // Get the previous sibling (the event row)
    row.scrollBy({
        top: 0,
        left: 300, // Adjust this value to control the scroll distance
        behavior: 'smooth' // Smooth scrolling
    });
}

// Add event listeners to all scroll buttons
document.querySelectorAll('.scroll-button').forEach(button => {
    button.addEventListener('click', scrollRight);
});

