// 純粋関数: 指定時刻がどの区間に属するかを返す
function findSegmentAtTime(splits, timeSec) {
  return splits.find((split) => timeSec >= split.start && timeSec <= split.end) || null;
}

// 純粋関数: 区間内の進捗率 (0-1)
function calcSegmentProgress(split, timeSec) {
  if (!split || split.end === split.start) return 0;
  const clamped = Math.min(Math.max(timeSec, split.start), split.end);
  return (clamped - split.start) / (split.end - split.start);
}

// 時刻を hh:mm 形式で返す
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// UI描画: 区間リスト
function renderSegmentList(listEl, splits, currentTime) {
  listEl.innerHTML = '';
  splits.forEach((split) => {
    const li = document.createElement('li');
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = split.segment;

    const span = document.createElement('span');
    span.className = 'duration';
    const duration = split.end - split.start;
    const isActive = currentTime >= split.start && currentTime <= split.end;
    span.textContent = `${formatTime(duration)}${isActive ? ' ・進行中' : ''}`;

    li.append(name, span);
    if (isActive) li.classList.add('active');
    listEl.appendChild(li);
  });
}

// UI描画: 全体バーと区間ハイライト
function renderProgressBar(trackEl, gridEl, splits, currentTime, totalEnd) {
  const overallProgress = Math.min((currentTime / totalEnd) * 100, 100);
  trackEl.style.setProperty('--progress', `${overallProgress}%`);

  gridEl.innerHTML = '';
  splits.forEach((split) => {
    const cell = document.createElement('div');
    cell.className = 'segment-cell';
    if (currentTime >= split.start && currentTime <= split.end) {
      cell.classList.add('active');
    }
    gridEl.appendChild(cell);
  });
}

async function init() {
  const selectEl = document.getElementById('athleteSelect');
  const sliderEl = document.getElementById('timeSlider');
  const maxTimeEl = document.getElementById('maxTime');
  const currentTimeEl = document.getElementById('currentTime');
  const currentSegmentEl = document.getElementById('currentSegment');
  const segmentProgressEl = document.getElementById('segmentProgress');
  const remainingTimeEl = document.getElementById('remainingTime');
  const segmentListEl = document.getElementById('segmentList');
  const progressTrackEl = document.getElementById('progressTrack');
  const segmentGridEl = document.getElementById('segmentGrid');

  let data;
  try {
    const res = await fetch('data/sample-chip-data.json');
    data = await res.json();
  } catch (err) {
    console.error('データの読み込みに失敗しました', err);
    return;
  }

  const athletes = data.athletes || [];
  athletes.forEach((athlete, index) => {
    const option = document.createElement('option');
    option.value = athlete.id;
    option.textContent = athlete.name;
    if (index === 0) option.selected = true;
    selectEl.appendChild(option);
  });

  const maxTime = Math.max(
    ...athletes.flatMap((athlete) => athlete.splits.map((s) => s.end))
  );
  sliderEl.max = String(maxTime);
  sliderEl.value = '0';
  maxTimeEl.textContent = `最大 ${formatTime(maxTime)}`;
  currentTimeEl.textContent = formatTime(Number(sliderEl.value));

  function updateView() {
    const selectedId = selectEl.value;
    const athlete = athletes.find((a) => a.id === selectedId) || athletes[0];
    const currentTime = Number(sliderEl.value);
    currentTimeEl.textContent = formatTime(currentTime);

    const segment = findSegmentAtTime(athlete.splits, currentTime);
    const progress = calcSegmentProgress(segment, currentTime);
    const remaining = Math.max(0, athlete.splits[athlete.splits.length - 1].end - currentTime);

    currentSegmentEl.textContent = segment ? segment.segment : '未スタート/ゴール後';
    segmentProgressEl.textContent = `${Math.round(progress * 100)}%`;
    remainingTimeEl.textContent = formatTime(remaining);

    renderProgressBar(progressTrackEl, segmentGridEl, athlete.splits, currentTime, maxTime);
    renderSegmentList(segmentListEl, athlete.splits, currentTime);
  }

  selectEl.addEventListener('change', updateView);
  sliderEl.addEventListener('input', updateView);

  updateView();
}

window.addEventListener('DOMContentLoaded', init);
