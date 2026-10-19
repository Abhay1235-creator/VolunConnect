
"use strict";

async function initializeProfilePage() {
  await window.volunConnectReady;

  const storage = window.VolunConnectStorage;
  const user = storage.requireRole(["volunteer"]);

  if (!user) return;

  const form = document.getElementById("profile-form");
  const nameInput = document.getElementById("profile-name");
  const emailInput = document.getElementById("profile-email");
  const roleInput = document.getElementById("profile-role");
  const joinedInput = document.getElementById("profile-joined");
  const message = document.getElementById("profile-message");

  
    function renderProfile(profile) {
    document.getElementById("profile-display-name").textContent =
        profile.name;

    document.getElementById("profile-display-email").textContent =
        profile.email;

    const avatar = document.getElementById("profile-avatar");
    const photoInput = document.getElementById("profile-image-input");
    const removeButton = document.getElementById("profile-image-remove");

    avatar.replaceChildren();

    if (
        profile.profileImage &&
        /^data:image\/(jpeg|png|webp);base64,/i.test(profile.profileImage)
    ) {
        const image = document.createElement("img");
        image.src = profile.profileImage;
        image.alt = `${profile.name}'s profile picture`;
        avatar.appendChild(image);
    } else {
        avatar.textContent =
        profile.name.trim().charAt(0).toUpperCase() || "V";
    }

    if (removeButton) {
        removeButton.hidden = !profile.profileImage;
    }

    nameInput.value = profile.name;
    emailInput.value = profile.email;
    roleInput.value = profile.role;

    joinedInput.value = profile.createdAt
        ? new Date(profile.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        })
        : "Not available";
    }


  renderProfile(user);
  
let selectedProfileImage = user.profileImage || "";

const photoInput = document.getElementById("profile-image-input");
const removePhotoButton = document.getElementById("profile-image-remove");

photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];
  if (!file) return;

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    message.className = "error";
    message.textContent = "Choose a JPG, PNG, or WebP image.";
    photoInput.value = "";
    return;
  }

  if (file.size > 1024 * 1024) {
    message.className = "error";
    message.textContent = "Choose an image smaller than 1 MB.";
    photoInput.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    selectedProfileImage = reader.result;

    renderProfile({
      ...storage.getCurrentUser(),
      name: nameInput.value,
      profileImage: selectedProfileImage
    });

    message.className = "";
    message.textContent = "Image preview ready. Save changes to keep it.";
  };

  reader.onerror = () => {
    message.className = "error";
    message.textContent = "Unable to read this image. Please try again.";
    photoInput.value = "";
  };

  reader.readAsDataURL(file);
});

removePhotoButton.addEventListener("click", () => {
  selectedProfileImage = "";
  photoInput.value = "";

  renderProfile({
    ...storage.getCurrentUser(),
    name: nameInput.value,
    profileImage: ""
  });

  message.className = "";
  message.textContent = "Picture removed from preview. Save changes to confirm.";
});


  
    
form.addEventListener("submit", (event) => {
  event.preventDefault();

  try {
    const updatedUser = storage.updateVolunteerProfile(user.id, {
      name: nameInput.value,
      profileImage: selectedProfileImage
    });

    selectedProfileImage = updatedUser.profileImage || "";
    renderProfile(updatedUser);

    message.className = "success";
    message.textContent = "Profile updated successfully.";
  } catch (error) {
    message.className = "error";
    message.textContent =
      error.message || "Unable to update your profile.";
  }
});


}

initializeProfilePage().catch((error) => {
  console.error("Profile page failed to load:", error);
  const message = document.getElementById("profile-message");
  if (message) {
    message.className = "error";
    message.textContent = "Unable to load your profile. Please refresh.";
  }
});
