let houses = {};
let addingHouse = false;
let deletingHouse = false;
let selectedHouse = null;
let numberingHouse = false;
let visitPlan = JSON.parse(localStorage.getItem("visitPlan")) || null;




document.getElementById("visitPlanBtn").addEventListener("click", () => {
  let planWindow = window.open("", "visitPlan", "width=1000,height=650");
  planWindow.document.write(`
<html>
<head>
  <title>خطة الزيارات</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
  <style>
    body { font-family: Tahoma; direction: rtl; padding: 20px; }
    table { border-collapse: collapse; width: 100%; margin-top: 15px; }
    th, td { border: 1px solid #333; padding: 8px; text-align: center; }
    input { padding: 5px; margin: 3px; width: 80px; }
    .indicator { margin-top: 15px; padding: 10px; font-weight: bold; }
    .summary { margin-top: 10px; font-weight: bold; }
    .fixed-col { background: #f0f0f0; font-weight: bold; }
    .planBox { border: 2px solid #444; margin: 15px 0; padding: 10px; border-radius: 8px; }
    .deleteBtn { margin-top: 10px; padding: 5px 10px; background: #c00; color: #fff; border: none; border-radius: 5px; cursor: pointer; }
    .planName { margin-bottom: 10px; }
  </style>
</head>
<body>
  <h2>خطة الزيارات</h2>
  <label>عدد العائلات: <input type="number" id="totalFamilies"></label><br>
  <label>عدد الأسابيع: <input type="number" id="totalWeeks"></label><br>
  <button id="generatePlan">➕ توليد خطة جديدة</button>
  <button id="savePlan">💾 حفظ جميع الخطط</button>
  <button id="resetPlan">🔄 إعادة تعيين الكل</button>
  <button id="exportExcel">📥 تصدير إلى Excel</button>
  <div id="plansContainer"></div>

<script>
let visitPlans = JSON.parse(localStorage.getItem("visitPlans")) || [];

if (visitPlans.length > 0) {
  visitPlans.forEach((plan, idx) => renderPlan(plan, idx));
}

document.getElementById("generatePlan").addEventListener("click", () => {
  const totalFamilies = parseInt(document.getElementById("totalFamilies").value);
  const totalWeeks = parseInt(document.getElementById("totalWeeks").value);
  if (!totalFamilies || !totalWeeks) { alert("من فضلك أدخل القيم"); return; }

  let newPlan = { name: "", totalFamilies, totalWeeks, weeks: [] };
  let base = Math.floor(totalFamilies / totalWeeks);
  let remainder = totalFamilies % totalWeeks;

  for (let i = 0; i < totalWeeks; i++) {
    let planned = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    newPlan.weeks.push({ basePlanned: planned, planned: planned, done: 0 });
  }

  visitPlans.push(newPlan);
  savePlans();
  renderAllPlans();
});

document.getElementById("exportExcel").addEventListener("click", () => {
  let wb = XLSX.utils.book_new();
  visitPlans.forEach((plan, idx) => {
    let ws_data = [["أسبوع", "المفروض الأصلي", "المفروض", "تمت"]];
    plan.weeks.forEach((week, i) => {
      ws_data.push([i+1, week.basePlanned, week.planned, week.done]);
    });
    let ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, plan.name || "خطة " + (idx+1));
  });
  XLSX.writeFile(wb, "VisitPlans.xlsx");
});

function renderAllPlans() {
  const plansDiv = document.getElementById("plansContainer");
  plansDiv.innerHTML = "";
  visitPlans.forEach((plan, idx) => renderPlan(plan, idx));
}

function renderPlan(plan, index) {
  const plansDiv = document.getElementById("plansContainer");

  let box = document.createElement("div");
  box.className = "planBox";
  box.innerHTML = "<h3>خطة رقم " + (index + 1) + "</h3>";

  let nameLabel = document.createElement("label");
  nameLabel.className = "planName";
  nameLabel.innerText = "اسم الخطة: ";
  let nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.value = plan.name || "";
  nameInput.placeholder = "اكتب اسم الخطة";
  nameInput.addEventListener("input", () => {
    plan.name = nameInput.value;
    savePlans();
  });
  nameLabel.appendChild(nameInput);
  box.appendChild(nameLabel);

  let table = document.createElement("table");
  table.innerHTML = "<tr><th>الأسبوع</th><th class='fixed-col'>المفروض الأصلي</th><th>المفروض</th><th>تمت</th></tr>";

  plan.weeks.forEach((week, i) => {
    let row = document.createElement("tr");
    row.innerHTML = \`
      <td>\${i+1}</td>
      <td class="fixed-col">\${week.basePlanned}</td>
      <td><input type="number" class="plannedInput" data-plan="\${index}" data-index="\${i}" value="\${week.planned}" min="0" /></td>
      <td><input type="number" class="doneInput" data-plan="\${index}" data-index="\${i}" value="\${week.done}" min="0" /></td>
    \`;
    table.appendChild(row);
  });

  box.appendChild(table);

  let indicator = document.createElement("div");
  indicator.className = "indicator";
  indicator.id = "progressIndicator_" + index;
  box.appendChild(indicator);

  let summary = document.createElement("div");
  summary.className = "summary";
  summary.id = "summaryTotals_" + index;
  box.appendChild(summary);

  let delBtn = document.createElement("button");
  delBtn.className = "deleteBtn";
  delBtn.innerText = "🗑️ حذف هذه الخطة";
  delBtn.addEventListener("click", () => {
    if (confirm("هل أنت متأكد من حذف الخطة رقم " + (index+1) + "؟")) {
      visitPlans.splice(index, 1);
      savePlans();
      renderAllPlans();
    }
  });
  box.appendChild(delBtn);

  plansDiv.appendChild(box);

  box.querySelectorAll(".plannedInput").forEach(input => {
    input.addEventListener("change", () => {
      let idx = parseInt(input.dataset.index);
      plan.weeks[idx].planned = parseInt(input.value) || 0;
      updateProgress(plan, index);
      savePlans();
    });
  });

  box.querySelectorAll(".doneInput").forEach(input => {
    input.addEventListener("change", () => {
      let idx = parseInt(input.dataset.index);
      plan.weeks[idx].done = parseInt(input.value) || 0;

      let diff = plan.weeks[idx].planned - plan.weeks[idx].done;
      if (diff > 0) {
        let remainWeeks = plan.totalWeeks - (idx + 1);
        if (remainWeeks > 0) {
          let perWeek = Math.floor(diff / remainWeeks);
          let extra = diff % remainWeeks;
          for (let j = idx + 1; j < plan.totalWeeks; j++) {
            plan.weeks[j].planned += perWeek;
            if (extra > 0) { plan.weeks[j].planned++; extra--; }
          }
        }
        plan.weeks[idx].planned = plan.weeks[idx].done;
      }

      savePlans();
      renderAllPlans();
    });
  });

  updateProgress(plan, index);
}

function updateProgress(plan, index) {
  let totalPlanned = 0, totalDone = 0;
  plan.weeks.forEach(week => {
    totalPlanned += week.planned;
    totalDone += week.done;
  });
  let percentage = totalPlanned > 0 ? Math.round((totalDone / totalPlanned) * 100) : 0;
  let indicator = document.getElementById("progressIndicator_" + index);
  indicator.innerText = "نسبة الإنجاز: " + percentage + "%";
  if (percentage < 40) indicator.style.background = "red";
  else if (percentage < 70) indicator.style.background = "yellow";
  else indicator.style.background = "lightgreen";

  document.getElementById("summaryTotals_" + index).innerText =
    "إجمالي المفروض: " + totalPlanned + " | إجمالي تمت: " + totalDone;
}

function savePlans() {
  localStorage.setItem("visitPlans", JSON.stringify(visitPlans));
}

document.getElementById("savePlan").addEventListener("click", () => {
  savePlans();
  alert("تم حفظ جميع الخطط ✅");
});

document.getElementById("resetPlan").addEventListener("click", () => {
  if (confirm("هل أنت متأكد من حذف كل الخطط؟")) {
    localStorage.removeItem("visitPlans");
    visitPlans = [];
    document.getElementById("plansContainer").innerHTML = "";
    alert("تم مسح كل الخطط 🔄");
  }
});
</script>
</body>
</html>
  `);
});



 

























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

        <input type="text" value="${family.phone}" 
      onchange="updateFamilyPhone('${houseId}', ${index}, this.value)" 
      placeholder="رقم الهاتف" />

    <input type="text" value="${family.code}" 
      onchange="updateFamilyCode('${houseId}', ${index}, this.value)" 
      placeholder="الكود" />

      <button class="green ${family.status === "green" ? "selected" : ""}" 
        onclick="updateFamily('${houseId}', ${index}, 'green')">✅</button>

      <button class="red ${family.status === "red" ? "selected" : ""}" 
        onclick="updateFamily('${houseId}', ${index}, 'red')">❌</button>

      <button onclick="deleteFamily('${houseId}', ${index})">🗑️</button>
    `;

    familiesDiv.appendChild(div);
  });

  function updateFamilyPhone(houseId, index, newPhone) {
    houses[houseId].families[index].phone = newPhone;
    saveData();
  }
  
  function updateFamilyCode(houseId, index, newCode) {
    houses[houseId].families[index].code = newCode;
    saveData();
  }


  

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

function updateFamilyPhone(houseId, index, newPhone) {
    houses[houseId].families[index].phone = newPhone;
    saveData();
  }
  
  // تعديل الكود
  function updateFamilyCode(houseId, index, newCode) {
    houses[houseId].families[index].code = newCode;
    saveData();
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

// تصدير بيانات البيوت كـ CSV
window.addEventListener("DOMContentLoaded", () => {
  const exportBtn = document.getElementById("exportExcelBtn");
  if (!exportBtn) {
    console.warn("زر التصدير exportExcelBtn غير موجود في الصفحة.");
    return;
  }

  exportBtn.addEventListener("click", () => {
    try {
      // عنوان الأعمدة
      const rows = [["رقم البيت", "اسم العائلة", "رقم التليفون", "الكود", "الحالة"]];

      // لف على البيوت
      for (const houseId in houses) {
        const house = houses[houseId];
        const houseNumber = house.number || houseId;

        if (!Array.isArray(house.families)) continue;

        house.families.forEach(family => {
          let statusText = "بدون حالة";
          if (family.status === "green") statusText = "صح";
          else if (family.status === "red") statusText = "خطأ";

          // تأكد من أن رقم التليفون محفوظ كنص للحفاظ على الصفر الأول
          const phoneText = family.phone ? `="${family.phone}"` : "";

          rows.push([
            houseNumber,
            family.name || "",
            phoneText,
            family.code || "",
            statusText
          ]);
        });
      }

      // تحويل للـ CSV (مفصول بفاصلة)
      const csv = rows.map(row => row.join(",")).join("\r\n");

      // إضافة BOM علشان العربي يظهر في Excel
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

// زر لإعادة كل الحالات بدون تغيير باقي البيانات
window.addEventListener("DOMContentLoaded", () => {
  const resetStatusBtn = document.getElementById("resetStatusBtn");
  if (!resetStatusBtn) {
    console.warn("زر التصدير resetStatusBtn غير موجود في الصفحة.");
    return;
  }

  resetStatusBtn.addEventListener("click", () => {
    try {
      for (const houseId in houses) {
        const house = houses[houseId];
        if (!Array.isArray(house.families)) continue;

        house.families.forEach(family => {
          family.status = null; // إعادة الحالة بدون حالة
        });
      }

      saveData(); // حفظ التغييرات
      alert("تم إعادة جميع الحالات بدون حالة ✅");

    } catch (err) {
      console.error(err);
      alert("حصل خطأ أثناء إعادة الحالات.");
    }
  });
});
