let houses = {};
let addingHouse = false;
let deletingHouse = false;
let selectedHouse = null;
let numberingHouse = false;

// زر إضافة بيت
document.getElementById("addHouseBtn").addEventListener("click", () => {
  addingHouse = true;
  alert("اضغط على الخريطة لاختيار مكان البيت الجديد 🏠");
});

// زر حذف بيت
document.getElementById("deleteHouseModeBtn").addEventListener("click", () => {
  deletingHouse = true;
  alert("اضغط على البيت الذي تريد حذفه ❌");
});


// زر ترقيم بيت
document.getElementById("numberHouseBtn").addEventListener("click", () => {
  numberingHouse = true;
  alert("اختر البيت الذي تريد ترقيمه 🏠");
});

// زر جرد أسماء العائلات
document.getElementById("listFamiliesBtn").addEventListener("click", () => {
  let greenNames = [];
  let redNames = [];
  let noneNames = [];

  for (const houseId in houses) {
    houses[houseId].families.forEach(family => {
      if (family.status === "green") greenNames.push(family.name);
      else if (family.status === "red") redNames.push(family.name);
      else noneNames.push(family.name);
    });
  }

  // إنشاء نافذة منبثقة
  const popup = window.open("", "_blank", "width=600,height=600,scrollbars=yes");
  popup.document.write("<h2>✅ العائلات الصحيحة</h2><p>" + (greenNames.join("<br>") || "لا يوجد") + "</p>");
  popup.document.write("<h2>❌ العائلات الخاطئة</h2><p>" + (redNames.join("<br>") || "لا يوجد") + "</p>");
  popup.document.write("<h2>➖ بدون حالة</h2><p>" + (noneNames.join("<br>") || "لا يوجد") + "</p>");
});


// لما تدوس على الخريطة
document.getElementById("numberHouseBtn").addEventListener("click", () => {
  numberingHouse = true;
  alert("اختر البيت الذي تريد ترقيمه 🏠");
});

// عداد البيوت ثابت وبيتحفظ في localStorage
let houseCounter = localStorage.getItem("houseCounter") 
  ? parseInt(localStorage.getItem("houseCounter")) 
  : 0;

// إضافة بيت جديد على الخريطة
document.getElementById("map").addEventListener("click", (e) => {
  if (addingHouse) {
    const map = document.getElementById("map");
    const rect = map.getBoundingClientRect();
    const topPercent = ((e.clientY - rect.top) / rect.height) * 100;
    const leftPercent = ((e.clientX - rect.left) / rect.width) * 100;

    // زود العداد وخزنه
    houseCounter++;
    localStorage.setItem("houseCounter", houseCounter);

    const newId = "house" + houseCounter;

    // إنشاء شكل البيت
    const houseDiv = document.createElement("div");
    houseDiv.className = "house";
    houseDiv.dataset.id = newId;
    houseDiv.style.top = topPercent + "%";
    houseDiv.style.left = leftPercent + "%";
    houseDiv.onclick = () => selectHouse(newId);

    map.appendChild(houseDiv);

    // تخزين بيانات البيت
    houses[newId] = {
      top: topPercent + "%",
      left: leftPercent + "%",
      families: [
        { name: "عائلة 1", status: null },
        { name: "عائلة 2", status: null },
        { name: "عائلة 3", status: null },
        { name: "عائلة 4", status: null }
      ]
    };

    // فحص البيت الجديد لو ليه تنبيه
    checkHouseAlert(newId);

    // حفظ البيانات
    saveData();

    addingHouse = false;
  }
});


// اختيار بيت
function selectHouse(houseId) {
  // وضع الحذف
  if (deletingHouse) {
    if (confirm("هل أنت متأكد من حذف هذا البيت؟")) {
      document.querySelector(`[data-id="${houseId}"]`).remove();
      delete houses[houseId];
      saveData();
    }
    deletingHouse = false;
    return;
  }

  // وضع الترقيم
  if (numberingHouse) {
    const newNumber = prompt("اكتب رقم البيت:", houses[houseId].number || "");
    if (newNumber !== null && newNumber.trim() !== "") {
      houses[houseId].number = newNumber;
      saveData();
      alert("تم حفظ رقم البيت ✅");
    }
    numberingHouse = false;
    return;
  }

  // --- الكود العادي لفتح بيانات البيت ---
  selectedHouse = houseId;
  const familiesDiv = document.getElementById("families");
  familiesDiv.innerHTML = "";

  // خانة رقم البيت
  const houseNumberInput = document.createElement("input");
  houseNumberInput.type = "text";
  houseNumberInput.value = houses[houseId].number || `بيت ${houseId}`;
  houseNumberInput.onchange = () => {
    houses[houseId].number = houseNumberInput.value;
    saveData();
  };

  const houseLabel = document.createElement("label");
  houseLabel.textContent = "إسم الشارع / رقم البيت :  ";

  const houseNumberDiv = document.createElement("div");
  houseNumberDiv.appendChild(houseLabel);
  houseNumberDiv.appendChild(houseNumberInput);
  familiesDiv.appendChild(houseNumberDiv);

  // العائلات
  houses[houseId].families.forEach((family, index) => {
    const div = document.createElement("div");
    div.className = "family";

    div.innerHTML = `
      <input type="text" value="${family.name}" 
        onchange="updateFamilyName('${houseId}', ${index}, this.value)" />

      <button class="green ${family.status === "green" ? "selected" : ""}" 
        onclick="updateFamily('${houseId}', ${index}, 'green')">✅</button>

      <button class="red ${family.status === "red" ? "selected" : ""}" 
        onclick="updateFamily('${houseId}', ${index}, 'red')">❌</button>

      <button onclick="deleteFamily('${houseId}', ${index})">🗑️</button>
    `;

    familiesDiv.appendChild(div);
  });

  // زر إضافة عائلة
  const addBtn = document.createElement("button");
  addBtn.textContent = "➕ إضافة عائلة";
  addBtn.onclick = () => addFamily(houseId);

  // زر تم (لإغلاق النافذة)
  const doneBtn = document.createElement("button");
  doneBtn.textContent = "✔️ تم";
  doneBtn.onclick = () => {
    document.getElementById("families").innerHTML = "";
    selectedHouse = null;
  };

  familiesDiv.appendChild(addBtn);
  familiesDiv.appendChild(doneBtn);
}

// تعديل اسم العائلة
function updateFamilyName(houseId, index, newName) {
  houses[houseId].families[index].name = newName;
  saveData();
}

// إضافة عائلة
function addFamily(houseId) {
  houses[houseId].families.push({ name: "عائلة جديدة", status: null });
  selectHouse(houseId);
  saveData();
}

// حذف عائلة
function deleteFamily(houseId, index) {
  houses[houseId].families.splice(index, 1);
  selectHouse(houseId);
  saveData();
}

// تحديث حالة العائلة
function updateFamily(houseId, index, status) {
  houses[houseId].families[index].status = status;
  checkHouseAlert(houseId);

  const familyDiv = document.getElementById("families").children[index + 1]; // +1 عشان رقم البيت أول عنصر
  familyDiv.querySelectorAll("button").forEach(btn => btn.classList.remove("selected"));

  if (status === "green") {
    familyDiv.querySelector(".green").classList.add("selected");
  } else {
    familyDiv.querySelector(".red").classList.add("selected");
  }

  saveData();
}

// دالة تحديد لون البيت حسب حالة العائلات
function checkHouseAlert(houseId) {
  const houseDiv = document.querySelector(`[data-id="${houseId}"]`);
  const statuses = houses[houseId].families.map(f => f.status);

  const greenCount = statuses.filter(s => s === "green").length;
  const redCount = statuses.filter(s => s === "red").length;
  const total = houses[houseId].families.length;

  if (greenCount === total && total > 0) {
    houseDiv.className = "house green";
  } else if (redCount === total && total > 0) {
    houseDiv.className = "house red";
  } else if (greenCount > 0 && redCount > 0) {
    houseDiv.className = "house orange";
  } else {
    houseDiv.className = "house gray";
  }
}

// زر الحفظ
document.getElementById("saveBtn").addEventListener("click", saveData);

function saveData() {
  localStorage.setItem("housesData", JSON.stringify(houses));
  alert("تم حفظ التغييرات ✅");
}


// تحميل البيانات عند فتح الموقع
window.onload = () => {
  const savedData = localStorage.getItem("housesData");
  if (savedData) {
    houses = JSON.parse(savedData);

    for (const houseId in houses) {
      const houseDiv = document.createElement("div");
      houseDiv.className = "house";
      houseDiv.dataset.id = houseId;
      houseDiv.style.top = houses[houseId].top;
      houseDiv.style.left = houses[houseId].left;
      houseDiv.onclick = () => selectHouse(houseId);

      document.getElementById("map").appendChild(houseDiv);
      checkHouseAlert(houseId);
    }
  }
};

// ================== الملاحظات ==================
window.addEventListener("DOMContentLoaded", () => {
  const notesBtn = document.getElementById("notesBtn");
  const notesWindow = document.getElementById("notesWindow");
  const notesText = document.getElementById("notesText");
  const saveNotesBtn = document.getElementById("saveNotesBtn");

  const savedNotes = localStorage.getItem("notes");
  if (savedNotes) {
    notesText.value = savedNotes;
  }

  notesBtn.addEventListener("click", () => {
    notesWindow.style.display = notesWindow.style.display === "none" ? "block" : "none";
  });

  saveNotesBtn.addEventListener("click", () => {
    localStorage.setItem("notes", notesText.value);
    alert("تم حفظ الملاحظات ✅");
    notesWindow.style.display = "none";
  });
});

// تصدير بيانات البيوت كـ CSV زي الملف المثال
window.addEventListener("DOMContentLoaded", () => {
  const exportBtn = document.getElementById("exportExcelBtn");
  if (!exportBtn) {
    console.warn("زر التصدير exportExcelBtn غير موجود في الصفحة.");
    return;
  }

  exportBtn.addEventListener("click", () => {
    try {
      // عنوان الأعمدة
      const rows = [["رقم البيت", "اسم العائلة", "الحالة"]];

      // لف على البيوت
      for (const houseId in houses) {
        const house = houses[houseId];
        const houseNumber = house.number || houseId;

        if (!Array.isArray(house.families)) continue;

        house.families.forEach(family => {
          let statusText = "بدون حالة";
          if (family.status === "green") statusText = "صح";
          else if (family.status === "red") statusText = "خطأ";

          rows.push([houseNumber, family.name || "", statusText]);
        });
      }

      // تحويل للـ CSV (مفصول بفاصلة)
      const csv = rows.map(row => row.join(",")).join("\r\n");

      // إضافة BOM علشان العربي يظهر
      const bomCsv = "\uFEFF" + csv;

      // إنشاء الملف
      const blob = new Blob([bomCsv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "houses_families.csv"; // اسم الملف
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("حصل خطأ أثناء التصدير.");
    }
  });
});



 // التكبير و التصغير
const map = document.getElementById("map");
let scale = 1; // التكبير الابتدائي
const scaleStep = 0.1; // مقدار التكبير/التصغير لكل خطوة

map.addEventListener("wheel", (e) => {
  e.preventDefault(); // منع السكروول الافتراضي للصفحة

  if (e.deltaY < 0) {
    // تدوير عجلة الماوس للأعلى → تكبير
    scale += scaleStep;
  } else {
    // تدوير عجلة الماوس للأسفل → تصغير
    scale -= scaleStep;
    if (scale < 0.1) scale = 0.1; // الحد الأدنى للتصغير
  }

  map.style.transform = `scale(${scale})`;
});

// منع الكليك يمين على الصور فقط
document.addEventListener("contextmenu", function(e){
  if (e.target.tagName === "IMG") {
    e.preventDefault();
  }
});


document.getElementById("listFamiliesBtn").addEventListener("click", () => {
  let greenNames = [];
  let redNames = [];
  let noStatusNames = [];

  for (const houseId in houses) {
    houses[houseId].families.forEach(family => {
      if (family.status === "green") {
        greenNames.push(family.name);
      } else if (family.status === "red") {
        redNames.push(family.name);
      } else {
        noStatusNames.push(family.name);
      }
    });
  }
});

document.getElementById("countFamiliesBtn").addEventListener("click", () => {
  let greenCount = 0;
  let redCount = 0;
  let noStatusCount = 0;

  for (const houseId in houses) {
    houses[houseId].families.forEach(family => {
      if (family.status === "green") {
        greenCount++;
      } else if (family.status === "red") {
        redCount++;
      } else {
        noStatusCount++;
      }
    });
  }

  alert(
    `إجمالي العائلات ✅ صحيحة: ${greenCount}\n` +
    `إجمالي العائلات ❌ خاطئة: ${redCount}\n` +
    `إجمالي العائلات ⚪ بدون حالة: ${noStatusCount}`
  );
});


document.getElementById("countHousesBtn").addEventListener("click", () => {
  const totalHouses = Object.keys(houses).length;
  alert(`إجمالي عدد البيوت 🏠: ${totalHouses}`);
});
