const DATA = [
  {
    id: \"stage0\",
    title: \"Giai đoạn 0 – Ôn JS (Hoàn thành)\",
    desc: \"Bạn đã làm xong phần JS core rồi 🔥\",
    items: [
      { id: \"s0_letconst\", text: \"let / const\", doneByDefault: true },
      { id: \"s0_arrow\", text: \"Arrow function\", doneByDefault: true },
      { id: \"s0_destructuring\", text: \"Destructuring\", doneByDefault: true },
      { id: \"s0_spread\", text: \"Spread operator\", doneByDefault: true },
      { id: \"s0_mapfilterreduce\", text: \"map / filter / reduce\", doneByDefault: true },
    ],
  },
  {
    id: \"stage1\",
    title: \"Giai đoạn 1 – React Core (2–3 tuần)\",
    desc: \"Đi đều từng ngày là lên tay nhanh lắm 😤\",
    sections: [
      {
        id: \"day1\",
        title: \"Day 1 – Setup & JSX\",
        subtitle: \"rồi\",
        items: [
          { id: \"d1_vite\", text: \"Tạo project bằng Vite\" },
          { id: \"d1_jsx\", text: \"Hiểu JSX là gì\" },
          { id: \"d1_app\", text: \"Tạo component App\" },
          { id: \"d1_component\", text: \"1️⃣ Component là gì\" },
          { id: \"d1_jsx2\", text: \"2️⃣ JSX là gì\" },
          { id: \"d1_props\", text: \"3️⃣ Props\" },
          { id: \"d1_state\", text: \"4️⃣ State (useState)\" },
          { id: \"d1_list\", text: \"5️⃣ Render list (map)\" },
        ],
      },
      {
        id: \"day2\",
        title: \"Day 2 – Component & Props\",
        items: [
          { id: \"d2_split\", text: \"Tách component\" },
          { id: \"d2_props\", text: \"Truyền props\" },
          { id: \"d2_destructure\", text: \"Destructuring props\" },
        ],
      },
      {
        id: \"day3\",
        title: \"Day 3 – useState\",
        items: [
          { id: \"d3_concept\", text: \"Khái niệm state\" },
          { id: \"d3_setstate\", text: \"setState đúng cách\" },
          { id: \"d3_counter\", text: \"Counter app\" },
        ],
      },
      {
        id: \"day4\",
        title: \"Day 4 – Event & Conditional Rendering\",
        items: [
          { id: \"d4_events\", text: \"onClick / onChange\" },
          { id: \"d4_conditional\", text: \"Điều kiện &&, ? :\" },
          { id: \"d4_toggle\", text: \"Toggle show/hide\" },
        ],
      },
      {
        id: \"day5\",
        title: \"Day 5 – Render List\",
        items: [
          { id: \"d5_map\", text: \"map render list\" },
          { id: \"d5_key\", text: \"key là gì\" },
          { id: \"d5_todo_show\", text: \"Todo list hiển thị\" },
        ],
      },
      {
        id: \"day6\",
        title: \"Day 6 – Form & Input\",
        items: [
          { id: \"d6_controlled\", text: \"Controlled component\" },
          { id: \"d6_form_add\", text: \"Form add todo\" },
        ],
      },
      {
        id: \"day7\",
        title: \"Day 7 – Lifting State\",
        items: [
          { id: \"d7_lift\", text: \"Đưa state lên component cha\" },
          { id: \"d7_callback\", text: \"Truyền callback\" },
        ],
      },
      {
        id: \"day8\",
        title: \"Day 8 – useEffect cơ bản\",
        items: [
          { id: \"d8_once\", text: \"useEffect chạy 1 lần\" },
          { id: \"d8_deps\", text: \"Dependency array\" },
        ],
      },
      {
        id: \"day9\",
        title: \"Day 9 – useEffect + API\",
        items: [
          { id: \"d9_fetch\", text: \"Fetch API\" },
          { id: \"d9_loading\", text: \"Loading / error\" },
        ],
      },
      {
        id: \"day10\",
        title: \"Day 10 – Mini Project\",
        items: [
          { id: \"d10_todo_full\", text: \"Todo app hoàn chỉnh\" },
          { id: \"d10_localstorage\", text: \"LocalStorage\" },
        ],
      },
    ],
  },
];
