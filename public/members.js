const img = document.getElementById("randomImage");

img.src = `/images/${Math.floor(Math.random() * 3)}.jpg`;