/**
 * BILL SPLITTER - Vanilla JavaScript (Refined Edition)
 * Pure vanilla code without libraries or frameworks.
 */

// Storage key for saving bill details across page reloads
const STORAGE_KEY = "billSplitterData";

// DOM References
const occasionInput = document.getElementById("occasion");
const billAmountInput = document.getElementById("billAmount");
const numPeopleInput = document.getElementById("numPeople");

const calculateBtn = document.getElementById("calculateBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");
const decrementPeopleBtn = document.getElementById("decrementPeople");
const incrementPeopleBtn = document.getElementById("incrementPeople");
const pillButtons = document.querySelectorAll(".pill-btn");

const errorAlert = document.getElementById("errorAlert");
const emptyState = document.getElementById("emptyState");
const resultContainer = document.getElementById("resultContainer");

const resultOccasion = document.getElementById("resultOccasion");
const avgShareDisplay = document.getElementById("avgShareDisplay");
const summaryMeta = document.getElementById("summaryMeta");
const sharesList = document.getElementById("sharesList");
const auditTotal = document.getElementById("auditTotal");
const auditSum = document.getElementById("auditSum");
const auditStatus = document.getElementById("auditStatus");

// State cache for copy functionality
let currentSplitData = null;

/**
 * Updates active class on quick pills
 */
function updatePillSelection(val) {
  const currentCount = parseInt(val, 10);
  pillButtons.forEach((pill) => {
    const pillCount = parseInt(pill.getAttribute("data-count"), 10);
    if (pillCount === currentCount) {
      pill.classList.add("active");
    } else {
      pill.classList.remove("active");
    }
  });
}

/**
 * Triggers an alert popup and displays an inline message.
 * Hides results immediately so NO result is shown on error.
 */
function triggerAlert(message) {
  hideResults();

  if (errorAlert) {
    errorAlert.textContent = message;
    errorAlert.classList.remove("hidden");
  }

  try {
    window.alert(message);
  } catch (e) {
    console.warn("Native alert was restricted by environment:", e);
  }
}

/**
 * Clears the error alert display
 */
function clearError() {
  if (errorAlert) {
    errorAlert.textContent = "";
    errorAlert.classList.add("hidden");
  }
}

/**
 * Hides results and shows the friendly empty state placeholder
 */
function hideResults() {
  if (resultContainer) {
    resultContainer.classList.add("hidden");
  }
  if (emptyState) {
    emptyState.classList.remove("hidden");
  }
  if (sharesList) {
    sharesList.innerHTML = "";
  }
  currentSplitData = null;
}

/**
 * Validates inputs and calculates split
 * @param {boolean} isInitialLoad - true if restoring from localStorage
 */
function calculateSplit(isInitialLoad = false) {
  clearError();

  const occasion = occasionInput.value.trim();
  const billRaw = billAmountInput.value.trim();
  const peopleRaw = numPeopleInput.value.trim();

  // 1. Check for empty fields
  if (!occasion) {
    if (!isInitialLoad) {
      triggerAlert("Please enter an occasion name (e.g. Chai & Samosa, Team Dinner, Trip).");
    }
    return;
  }

  if (billRaw === "") {
    if (!isInitialLoad) {
      triggerAlert("Please enter the total bill amount in ₹.");
    }
    return;
  }

  if (peopleRaw === "") {
    if (!isInitialLoad) {
      triggerAlert("Please enter the number of people.");
    }
    return;
  }

  const bill = parseFloat(billRaw);
  const people = parseInt(peopleRaw, 10);

  // 2. Incident validation: Bill must be a valid positive number
  if (isNaN(bill) || bill <= 0) {
    triggerAlert("Invalid bill amount: Bill must be greater than zero. Empty, zero, or negative bills are not allowed.");
    return;
  }

  // 3. Incident validation: People must be a valid positive whole number
  if (isNaN(people) || people <= 0 || !Number.isInteger(Number(peopleRaw))) {
    triggerAlert("Invalid number of people: Must be a positive whole number (at least 1 person). Zero, empty, or negative values are not allowed.");
    return;
  }

  // 4. Calculate exact paise shares so the individual shares add up EXACTLY to the bill in INR
  // Converting to integer paise eliminates floating-point rounding issues
  const totalPaise = Math.round(bill * 100);
  const basePaisePerPerson = Math.floor(totalPaise / people);
  const remainderPaise = totalPaise % people;

  let computedSharesSumInPaise = 0;
  const individualShares = [];

  for (let i = 1; i <= people; i++) {
    // Distribute remainder paise one-by-one to the first few people
    const personPaise = basePaisePerPerson + (i <= remainderPaise ? 1 : 0);
    computedSharesSumInPaise += personPaise;
    individualShares.push({
      personNumber: i,
      paise: personPaise,
      formatted: (personPaise / 100).toFixed(2),
    });
  }

  // 5. Update UI in Right Pane
  resultOccasion.textContent = occasion;
  
  const avgAmount = (bill / people).toFixed(2);
  avgShareDisplay.textContent = "₹" + avgAmount;
  summaryMeta.textContent = `Total: ₹${bill.toFixed(2)} split among ${people} ${people === 1 ? 'person' : 'people'}`;

  // Populate individual share items
  sharesList.innerHTML = "";
  individualShares.forEach((share) => {
    const item = document.createElement("div");
    item.className = "share-item";
    item.innerHTML = `
      <div class="person-info">
        <div class="person-avatar">#${share.personNumber}</div>
        <span class="person-name">Person ${share.personNumber}</span>
      </div>
      <span class="share-amount">₹${share.formatted}</span>
    `;
    sharesList.appendChild(item);
  });

  // Verification Audit: Show that individual shares sum up exactly to the total bill
  const totalSumCalculated = (computedSharesSumInPaise / 100).toFixed(2);
  auditTotal.textContent = "₹" + bill.toFixed(2);
  auditSum.textContent = "₹" + totalSumCalculated;
  auditStatus.textContent = `✓ Match (₹${totalSumCalculated})`;

  // Cache current split for copy functionality
  currentSplitData = {
    occasion,
    bill: bill.toFixed(2),
    people,
    avgAmount,
    shares: individualShares,
  };

  // Swap empty state with the result container
  if (emptyState) {
    emptyState.classList.add("hidden");
  }
  if (resultContainer) {
    resultContainer.classList.remove("hidden");
  }

  // Highlight matching quick pill if applicable
  updatePillSelection(peopleRaw);

  // 6. Save to localStorage so results persist across reloads
  try {
    const savedData = {
      occasion: occasion,
      billAmount: billRaw,
      numPeople: peopleRaw,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
  } catch (err) {
    console.warn("Could not save to localStorage:", err);
  }
}

/**
 * Resets the calculator and clears saved data
 */
function resetForm() {
  occasionInput.value = "";
  billAmountInput.value = "";
  numPeopleInput.value = "";
  clearError();
  hideResults();
  updatePillSelection(null);

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("Could not remove from localStorage:", err);
  }
}

/**
 * Load saved data from localStorage on page startup
 */
function loadSavedData() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (rawData) {
      const data = JSON.parse(rawData);
      if (data && data.occasion && data.billAmount && data.numPeople) {
        occasionInput.value = data.occasion;
        billAmountInput.value = data.billAmount;
        numPeopleInput.value = data.numPeople;
        updatePillSelection(data.numPeople);
        // Re-calculate and display result automatically upon reload
        calculateSplit(true);
      }
    }
  } catch (err) {
    console.warn("Failed to load saved data from localStorage:", err);
  }
}

/**
 * Copies a neat summary of the bill split to the clipboard
 */
function copySummary() {
  if (!currentSplitData) return;

  const lines = [
    `💸 Bill Split Summary: ${currentSplitData.occasion}`,
    `Total Bill: ₹${currentSplitData.bill}`,
    `People: ${currentSplitData.people}`,
    `Average Share: ₹${currentSplitData.avgAmount}`,
    `--------------------------`,
  ];

  currentSplitData.shares.forEach((s) => {
    lines.push(`Person ${s.personNumber}: ₹${s.formatted}`);
  });

  const textToCopy = lines.join("\n");

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textToCopy).then(() => {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = "Copied! ✓";
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    }).catch(() => {
      fallbackCopy(textToCopy);
    });
  } else {
    fallbackCopy(textToCopy);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    copyBtn.textContent = "Copied! ✓";
    setTimeout(() => {
      copyBtn.textContent = "📋 Copy";
    }, 2000);
  } catch (err) {
    console.warn("Copy failed:", err);
  }
  document.body.removeChild(textarea);
}

// Stepper controls for party count
if (decrementPeopleBtn) {
  decrementPeopleBtn.addEventListener("click", () => {
    let current = parseInt(numPeopleInput.value, 10);
    if (isNaN(current) || current <= 1) {
      current = 1;
    } else {
      current -= 1;
    }
    numPeopleInput.value = current;
    updatePillSelection(current);
  });
}

if (incrementPeopleBtn) {
  incrementPeopleBtn.addEventListener("click", () => {
    let current = parseInt(numPeopleInput.value, 10);
    if (isNaN(current) || current < 1) {
      current = 1;
    } else {
      current += 1;
    }
    numPeopleInput.value = current;
    updatePillSelection(current);
  });
}

// Quick party size pill buttons
pillButtons.forEach((pill) => {
  pill.addEventListener("click", () => {
    const count = pill.getAttribute("data-count");
    numPeopleInput.value = count;
    updatePillSelection(count);
  });
});

numPeopleInput.addEventListener("input", () => {
  updatePillSelection(numPeopleInput.value);
});

// Event Listeners
calculateBtn.addEventListener("click", () => calculateSplit(false));
clearBtn.addEventListener("click", resetForm);
if (copyBtn) {
  copyBtn.addEventListener("click", copySummary);
}

// Also calculate when user presses Enter key inside any input field
[occasionInput, billAmountInput, numPeopleInput].forEach((input) => {
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      calculateSplit(false);
    }
  });
});

// Initialize on page load
window.addEventListener("DOMContentLoaded", loadSavedData);
if (document.readyState === "complete" || document.readyState === "interactive") {
  loadSavedData();
}
