(() => {
  'use strict';
  const {rows, topics, uiTags} = window.CATALOG;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const fold = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const validUrl = u => /^https?:\/\//i.test(u || '') ? u : '#';
  const synonyms = {dtks:['dtks','dtsen','bansos'],dtsen:['dtsen','dtks','bansos'],bpjs:['bpjs','jkn'],jkn:['jkn','bpjs'],motor:['motor','kendaraan','samsat'],mobil:['mobil','kendaraan','samsat'],kerja:['kerja','lowongan','karir','karirhub'],beasiswa:['beasiswa','kip','kipk','lpdp'],paspor:['paspor','imigrasi'],ktp:['ktp','dukcapil','kependudukan'],pajak:['pajak','coretax','samsat']};
  const topicMap = Object.fromEntries(topics.map(x => [x.id, x.label]));
  const tagGroups = [
    ['Bantuan & kesehatan','♡','#c31336',['bansos','kurang-mampu','bpjs','jkn','pkh','sembako']],
    ['Pendidikan','✦','#6750a4',['beasiswa','pendidikan','kuliah','sekolah','guru','buku','riset']],
    ['Kerja & jaminan sosial','↗','#006d77',['kerja','lowongan','pelatihan','magang','asn','cpns','pppk','jmo','jht','pensiun']],
    ['Pajak & kendaraan','◉','#8b5e00',['pajak','npwp','spt','kendaraan','sim','stnk','samsat','polisi']],
    ['Identitas & agama','◇','#26547c',['paspor','visa','ktp','kk','akta','nikah','haji','umrah','zakat','halal']],
    ['Hukum & pengaduan','§','#7a2849',['hukum','uu','peraturan','bantuan-hukum','pengaduan','korupsi','penipuan']],
    ['Usaha & properti','◆','#525b2a',['usaha','umkm','nib','perizinan','merek','paten','pengadaan','rumah','subsidi','tanah','sertifikat','listrik','bbm']],
    ['Transportasi & lingkungan','≋','#147a52',['transportasi','kereta','kapal','bus','lingkungan','hutan','karhutla','sampah','cuaca','bencana']],
    ['Pangan, data & digital','⌁','#a13d00',['pangan','pertanian','perikanan','statistik','data-terbuka','digital','siber','pemilu']]
  ];
  const state = {q:'', topic:'', tags:new Set(), tagQuery:'', view:'all', status:'sourced', access:'all', sort:'priority', page:1, pageSize:8};
  let filtered = [];
  let saved = loadSaved();

  function loadSaved(){
    try {
      const ids = JSON.parse(localStorage.getItem('satupintu-v2') || '[]');
      const old = JSON.parse(localStorage.getItem('satupintu-simpan') || '[]');
      const byUrl = new Map(rows.map(r => [r.url, r.id]));
      old.forEach(u => { if(byUrl.has(u)) ids.push(byUrl.get(u)); });
      return new Set(ids.filter(id => rows.some(r => r.id === id)));
    } catch { return new Set(); }
  }
  function saveSaved(){ try { localStorage.setItem('satupintu-v2', JSON.stringify([...saved])); return true; } catch { return false; } }
  const clockFormats={
    wib:new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}),
    wita:new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Makassar',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}),
    wit:new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jayapura',hour:'2-digit',minute:'2-digit',hourCycle:'h23'})
  };
  const updateClocks=()=>{const now=new Date();Object.entries(clockFormats).forEach(([zone,format])=>{$(`#clock-${zone}`).textContent=format.format(now).replace('.',':');});};
  updateClocks();setInterval(updateClocks,1000);
  function shouldShowWelcome(){
    const now=new Date();
    const today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
    try {
      if(localStorage.getItem('satupintu-welcome-date')===today)return false;
      localStorage.setItem('satupintu-welcome-date',today);
      return true;
    } catch { return true; }
  }
  function hay(r){ return fold([r.judul_tugas,r.nama,r.ringkasan,r.deskripsi,r.instansi,r.tags,r.sektor,...(r.nama_lain||[])].join(' ')); }
  function queryMatch(r){
    const q = fold(state.q).trim(); if(!q) return true;
    const h = hay(r);
    return q.split(/\s+/).every(token => (synonyms[token] || [token]).some(x => h.includes(x)));
  }
  function statusMatch(r){
    if(state.status === 'all') return true;
    if(state.status === 'sourced') return r.status_kurasi === 'sumber_tersedia';
    if(state.status === 'reachable') return r.status_tautan === 'terjangkau_http_200';
    return r.status_kurasi !== 'sumber_tersedia' || !['terjangkau_http_200'].includes(r.status_tautan);
  }
  function applyFilters(){
    filtered = rows.filter(r => queryMatch(r)
      && (!state.topic || r.bidang === state.topic)
      && [...state.tags].every(t => (r.tag_utama || []).includes(t) || String(r.tags).split(';').includes(t))
      && (state.view === 'all' || state.view === 'saved' || r.kelompok === state.view)
      && (state.view !== 'saved' || saved.has(r.id))
      && statusMatch(r)
      && (state.access === 'all' || r.akses === state.access));
    filtered.sort((a,b) => state.sort === 'az' ? (a.judul_tugas||a.nama).localeCompare(b.judul_tugas||b.nama,'id') : state.sort === 'institution' ? (a.instansi||'zzz').localeCompare(b.instansi||'zzz','id') : (b.prioritas||0)-(a.prioritas||0) || (a.judul_tugas||a.nama).localeCompare(b.judul_tugas||b.nama,'id'));
  }
  function statusBadge(r){
    if(r.status_tautan === 'terjangkau_http_200') return '<span class="badge ok">Bisa dibuka</span>';
    if(r.status_kurasi !== 'sumber_tersedia') return '<span class="badge warn">Belum diverifikasi</span>';
    return '<span class="badge warn">Akses belum pasti</span>';
  }
  function linkLabel(r){
    if(r.status_tautan === 'terjangkau_http_200') return 'Bisa dibuka saat diperiksa';
    if(r.status_kurasi !== 'sumber_tersedia') return 'Belum diverifikasi tim kurasi';
    if(r.status_tautan === 'pemeliharaan') return 'Sedang dalam pemeliharaan';
    if(String(r.status_tautan).includes('dibatasi')) return 'Akses otomatis dibatasi';
    return 'Tautan tersedia, akses belum bisa dipastikan';
  }
  function accessLabel(v){ return ({publik:'Bisa langsung dibuka','akun-masyarakat':'Perlu akun pribadi','akun-pelaku-usaha':'Perlu akun usaha',petugas:'Khusus petugas',campuran:'Cara masuk berbeda'}[v] || v || 'Cara masuk belum dicatat'); }
  function card(r, i){
    const title = r.judul_tugas || r.nama;
    const original = title !== r.nama ? `<p class="original">${esc(r.nama)}</p>` : '<p class="original">&nbsp;</p>';
    return `<article class="card" data-id="${esc(r.id)}" tabindex="0" aria-label="Lihat detail ${esc(title)}">
      <div class="card-top"><span class="number">${String(i+1).padStart(3,'0')} · ${esc(topicMap[r.bidang]||r.sektor)}</span><button class="save ${saved.has(r.id)?'active':''}" data-save="${esc(r.id)}" aria-label="${saved.has(r.id)?'Hapus dari':'Simpan ke'} daftar" aria-pressed="${saved.has(r.id)}">${saved.has(r.id)?'★':'☆'}</button></div>
      <h3>${esc(title)}</h3>${original}<p class="summary">${esc(r.ringkasan || r.deskripsi)}</p>
      <div class="meta">${statusBadge(r)}<span class="badge">${esc(accessLabel(r.akses))}</span>${r.cakupan!=='nasional'?`<span class="badge">${esc(r.cakupan)}</span>`:''}</div>
      <div class="card-foot"><span class="institution" title="${esc(r.instansi)}">${esc(r.instansi || 'Pengelola belum dicatat')}</span><span class="card-actions"><button data-copy="${esc(validUrl(r.url_akhir||r.url))}">Salin</button><a href="${esc(validUrl(r.url_akhir||r.url))}" target="_blank" rel="noopener noreferrer">Buka ↗</a></span></div>
    </article>`;
  }
  function renderTopics(){
    const base = rows.filter(r => queryMatch(r) && statusMatch(r));
    $('#topic-select').innerHTML = '<option value="">Semua bidang</option>'+topics.map(t => {
      const n = base.filter(r => r.bidang === t.id).length;
      return `<option value="${t.id}" ${!n&&state.topic!==t.id?'disabled':''}>${esc(t.label)} · ${n}</option>`;
    }).join('');
    $('#topic-select').value=state.topic;
  }
  function renderTags(){
    const base = rows.filter(r => queryMatch(r) && (!state.topic || r.bidang === state.topic) && statusMatch(r));
    const counts = Object.fromEntries(uiTags.map(t => [t, base.filter(r => (r.tag_utama||[]).includes(t) || String(r.tags).split(';').includes(t)).length]));
    const needle=fold(state.tagQuery).trim();
    const groups=tagGroups.map(([label,_icon,color,tags],index)=>{
      const visible=tags.filter(t=>(counts[t]||state.tags.has(t)) && (!needle||fold(t).includes(needle)));
      if(!visible.length)return '';
      const open=needle || index<2 || visible.some(t=>state.tags.has(t));
      return `<details class="tag-group" style="--group-color:${color}" ${open?'open':''}><summary><span class="tag-group-name"><small class="tag-count">${visible.length}</small>${esc(label)}</span></summary><div class="tag-group-list">${visible.map(t=>`<button data-tag="${esc(t)}" class="${state.tags.has(t)?'active':''}" aria-pressed="${state.tags.has(t)}">${esc(t)} <small>${counts[t]}</small></button>`).join('')}</div></details>`;
    }).join('');
    $('#tags').innerHTML=groups || '<p class="tag-empty">Tag tidak ditemukan.</p>';
  }
  function renderActive(){
    const bits=[];
    if(state.q) bits.push(`<button data-clear="q">“${esc(state.q)}”</button>`);
    if(state.topic) bits.push(`<button data-clear="topic">${esc(topicMap[state.topic])}</button>`);
    state.tags.forEach(t => bits.push(`<button data-clear-tag="${esc(t)}">${esc(t)}</button>`));
    if(state.access!=='all') bits.push(`<button data-clear="access">${esc(accessLabel(state.access))}</button>`);
    $('#active-filters').innerHTML=bits.join('');
  }
  function syncControls(){
    $('#search').value=state.q; $('#clear-search').hidden=!state.q; $('#tag-search').value=state.tagQuery;
    $('#status').value=state.status; $('#access').value=state.access; $('#sort').value=state.sort;
    $$('.tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.view===state.view)));
    $('#saved-count').textContent=saved.size;
    const filterCount=(state.topic?1:0)+state.tags.size+(state.status!=='sourced'?1:0)+(state.access!=='all'?1:0)+(state.view!=='all'?1:0);
    $('#filter-count').textContent=filterCount;
  }
  function updateHash(){
    const p=new URLSearchParams();
    if(state.q)p.set('q',state.q);if(state.topic)p.set('k',state.topic);if(state.tags.size)p.set('t',[...state.tags].join(','));if(state.view!=='all')p.set('v',state.view);if(state.status!=='sourced')p.set('st',state.status);if(state.access!=='all')p.set('a',state.access);if(state.sort!=='priority')p.set('s',state.sort);if(state.page>1)p.set('p',state.page);
    history.replaceState(null,'',p.toString()?'#'+p.toString():location.pathname+location.search);
  }
  function render(){
    applyFilters(); renderTopics(); renderTags(); renderActive(); syncControls();
    const totalPages=Math.max(1,Math.ceil(filtered.length/state.pageSize));state.page=Math.min(state.page,totalPages);
    const start=(state.page-1)*state.pageSize,shown=filtered.slice(start,start+state.pageSize);
    $('#cards').innerHTML=shown.map((r,i)=>card(r,start+i)).join('');
    $('#result-count').textContent=filtered.length.toLocaleString('id-ID');
    $('#live').textContent=`${filtered.length} hasil ditemukan`;
    $('#empty').hidden=filtered.length!==0;
    const pages=[...new Set([1,totalPages,state.page-1,state.page,state.page+1])].filter(n=>n>=1&&n<=totalPages).sort((a,b)=>a-b);
    let pageHtml=`<button data-page="${state.page-1}" ${state.page===1?'disabled':''}>← Sebelumnya</button>`;
    pages.forEach((n,i)=>{if(i&&n-pages[i-1]>1)pageHtml+='<span>…</span>';pageHtml+=`<button data-page="${n}" ${n===state.page?'aria-current="page"':''}>${n}</button>`;});
    pageHtml+=`<button data-page="${state.page+1}" ${state.page===totalPages?'disabled':''}>Berikutnya →</button>`;
    $('#pagination').innerHTML=pageHtml;$('#pagination').hidden=filtered.length===0||totalPages===1;
    updateHash();
  }
  function reset(){ Object.assign(state,{q:'',topic:'',tagQuery:'',view:'all',status:'sourced',access:'all',sort:'priority',page:1}); state.tags.clear(); render(); }
  function toast(msg){ const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2200); }
  async function copy(text){ try{await navigator.clipboard.writeText(text);toast('Tautan disalin');}catch{const x=document.createElement('textarea');x.value=text;document.body.append(x);x.select();document.execCommand('copy');x.remove();toast('Tautan disalin');} }
  function showDetail(id){
    const r=rows.find(x=>x.id===id); if(!r)return;
    const url=validUrl(r.url_akhir||r.url); const tags=String(r.tags||'').split(';').filter(Boolean);
    $('#detail-body').innerHTML=`<div class="detail-inner"><p class="eyebrow">${esc(topicMap[r.bidang]||r.sektor)} · ${esc(r.kelompok)}</p><h2>${esc(r.judul_tugas||r.nama)}</h2><p class="original">${esc(r.nama)}</p><p>${esc(r.ringkasan||r.deskripsi)}</p>
      <div class="detail-grid"><div><small>Pengelola</small><b>${esc(r.instansi||'Belum dicatat')}</b></div><div><small>Cara masuk</small><b>${esc(accessLabel(r.akses))}</b></div><div><small>Kurasi data</small><b>${esc(r.status_kurasi==='sumber_tersedia'?'Sumber tercatat':'Belum diverifikasi')}</b></div><div><small>Kondisi tautan</small><b>${esc(linkLabel(r))}${r.http_status?' · HTTP '+r.http_status:''}</b></div><div><small>Cakupan</small><b>${esc([r.cakupan,r.provinsi,r.kabupaten_kota].filter(Boolean).join(' · '))}</b></div><div><small>Diperiksa</small><b>${esc(r.tanggal_periksa||'Belum dicatat')}</b></div></div>
      ${r.catatan?`<p><b>Catatan:</b> ${esc(r.catatan)}</p>`:''}<div class="all-tags">${tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div><div class="detail-actions"><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Buka layanan ↗</a><button data-copy="${esc(url)}">Salin tautan</button></div></div>`;
    $('#detail').showModal();
  }
  function exportCsv(){
    const cols=['judul_tugas','nama','ringkasan','url','bidang','sektor','kelompok','tags','instansi','jenis_pengelola','jenis_layanan','akses','cakupan','provinsi','kabupaten_kota','status_kurasi','status_tautan','tanggal_periksa','sumber_url','catatan'];
    const q=v=>`"${String(v??'').replace(/^([=+\-@])/,'\' $1').replaceAll('"','""')}"`;
    const csv='\ufeff'+[cols.join(','),...filtered.map(r=>cols.map(c=>q(r[c])).join(','))].join('\r\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='hasil-layanan-satu-pintu.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast(`${filtered.length} baris CSV diunduh`);
  }
  function readHash(){
    const p=new URLSearchParams(location.hash.slice(1)); const topicsOk=new Set(topics.map(t=>t.id)); const tagsOk=new Set(uiTags);
    state.q=p.get('q')||''; if(topicsOk.has(p.get('k')))state.topic=p.get('k');
    (p.get('t')||'').split(',').filter(t=>tagsOk.has(t)).forEach(t=>state.tags.add(t));
    if(['all','layanan','referensi','wilayah','saved'].includes(p.get('v')))state.view=p.get('v');
    if(['sourced','reachable','review','all'].includes(p.get('st')))state.status=p.get('st');
    if(['all','publik','akun-masyarakat','akun-pelaku-usaha','petugas'].includes(p.get('a')))state.access=p.get('a');
    if(['priority','az','institution'].includes(p.get('s')))state.sort=p.get('s');
    const page=Number(p.get('p'));if(Number.isInteger(page)&&page>1)state.page=page;
  }
  document.addEventListener('click',e=>{
    const interactive=e.target.closest('button,a');
    if(!interactive){
      const cardEl=e.target.closest('.card');
      if(cardEl && !String(window.getSelection()).trim())showDetail(cardEl.dataset.id);
      return;
    }
    const b=e.target.closest('button'); if(!b)return;
    if(b.dataset.quick!==undefined){state.q=b.dataset.quick;state.page=1;render();$('#jelajah').scrollIntoView({behavior:'smooth'});}
    if(b.dataset.topic!==undefined){state.topic=state.topic===b.dataset.topic?'':b.dataset.topic;state.page=1;render();}
    if(b.dataset.tag!==undefined){state.tags.has(b.dataset.tag)?state.tags.delete(b.dataset.tag):state.tags.add(b.dataset.tag);state.page=1;render();}
    if(b.dataset.view!==undefined){state.view=b.dataset.view;state.page=1;render();}
    if(b.dataset.save!==undefined){saved.has(b.dataset.save)?saved.delete(b.dataset.save):saved.add(b.dataset.save);saveSaved()?toast(saved.has(b.dataset.save)?'Disimpan':'Dihapus dari simpanan'):toast('Browser memblokir penyimpanan');render();}
    if(b.dataset.copy!==undefined)copy(b.dataset.copy);
    if(b.dataset.clear==='q'){state.q='';state.page=1;render();} if(b.dataset.clear==='topic'){state.topic='';state.page=1;render();} if(b.dataset.clear==='access'){state.access='all';state.page=1;render();}
    if(b.dataset.clearTag){state.tags.delete(b.dataset.clearTag);state.page=1;render();}
    if(b.dataset.page!==undefined&&!b.disabled){state.page=Number(b.dataset.page);render();requestAnimationFrame(()=>$('#result-title').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'}));}
  });
  document.addEventListener('keydown',e=>{
    if((e.key==='Enter'||e.key===' ') && e.target.matches('.card')){
      e.preventDefault();
      showDetail(e.target.dataset.id);
    }
  });
  $('#search').addEventListener('input',e=>{state.q=e.target.value;state.page=1;render();});
  $('#topic-select').addEventListener('change',e=>{state.topic=e.target.value;state.page=1;render();});
  $('#clear-search').addEventListener('click',()=>{state.q='';state.page=1;render();$('#search').focus();});
  $('#status').addEventListener('change',e=>{state.status=e.target.value;state.page=1;render();});
  $('#access').addEventListener('change',e=>{state.access=e.target.value;state.page=1;render();});
  $('#sort').addEventListener('change',e=>{state.sort=e.target.value;state.page=1;render();});
  $('#tag-search').addEventListener('input',e=>{state.tagQuery=e.target.value;renderTags();});
  $('#reset').addEventListener('click',reset); $('#empty-reset').addEventListener('click',reset);
  $('#filter-toggle').addEventListener('click',()=>{const open=$('#filters').classList.toggle('mobile-open');$('#filter-toggle').setAttribute('aria-expanded',String(open));});
  const loadScript=src=>new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=()=>reject(new Error(`Gagal memuat ${src}`));document.head.append(script);});
  let gameLoader;
  const ensureGame=()=>gameLoader||(gameLoader=(window.THREE?Promise.resolve():loadScript('https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js')).then(()=>loadScript('assets/js/game.js?v=10')));
  $('#game-open').addEventListener('click',async()=>{
    const dialog=$('#game-dialog'),message=$('#game-message'),start=$('#game-start');
    if(!dialog.open)dialog.showModal();
    message.textContent='Menyiapkan permainan…';start.hidden=true;
    try {
      await ensureGame();
      message.textContent='Siap melewati masalah?';start.hidden=false;
      if(dialog.open)dispatchEvent(new Event('satupintu-game-open'));
    } catch {
      message.textContent='Game gagal dimuat. Periksa koneksi lalu coba lagi.';start.hidden=true;
    }
  });
  $('#game-close').addEventListener('click',()=>$('#game-dialog').close());
  $$('[data-welcome-topic]').forEach(button=>button.addEventListener('click',()=>{
    state.topic=button.dataset.welcomeTopic;
    state.q=''; state.page=1;
    render();
    $('#welcome-dialog').close();
    $('#jelajah').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  }));
  $('#welcome-close').addEventListener('click',()=>$('#welcome-dialog').close());
  $('#welcome-search').addEventListener('click',()=>{
    $('#welcome-dialog').close();
    $('#jelajah').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    setTimeout(()=>$('#search').focus(),350);
  });
  $('#export').addEventListener('click',exportCsv);
  $('.dialog-close').addEventListener('click',()=>$('#detail').close()); $('#detail').addEventListener('click',e=>{if(e.target===$('#detail'))$('#detail').close();});
  const hero=$('.hero');
  if(hero){
    const heroObserver=new IntersectionObserver(([entry])=>{
      document.body.classList.toggle('hero-passed',!entry.isIntersecting && entry.boundingClientRect.top<0);
    },{threshold:0});
    heroObserver.observe(hero);
  }
  if(hero && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    let frame,scrollFrame;
    hero.addEventListener('pointermove',e=>{
      cancelAnimationFrame(frame);
      frame=requestAnimationFrame(()=>{
        const r=hero.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
        hero.style.setProperty('--mx',`${x*9}px`); hero.style.setProperty('--my',`${y*7}px`);
        hero.style.setProperty('--rx',`${x*-24}px`); hero.style.setProperty('--ry',`${y*-18}px`);
      });
    });
    hero.addEventListener('pointerleave',()=>['--mx','--my','--rx','--ry'].forEach(v=>hero.style.setProperty(v,'0px')));
    addEventListener('scroll',()=>{
      cancelAnimationFrame(scrollFrame);
      scrollFrame=requestAnimationFrame(()=>{
        const rect=hero.getBoundingClientRect(), progress=Math.max(-1,Math.min(1,-rect.top/Math.max(1,rect.height)));
        hero.style.setProperty('--sy',`${progress*46}px`);
      });
    },{passive:true});
  }
  const tail=$('#cursor-tail');
  if(tail && matchMedia('(pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    const ctx=tail.getContext('2d');
    let points=[],last=null,raf=0,dpr=1;
    const resizeTail=()=>{
      dpr=Math.min(devicePixelRatio||1,2);
      tail.width=Math.round(innerWidth*dpr); tail.height=Math.round(innerHeight*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    const drawTail=()=>{
      ctx.clearRect(0,0,innerWidth,innerHeight);
      points=points.filter(p=>p.life<1);
      points.forEach(p=>{
        p.life+=.034; p.x+=p.vx; p.y+=p.vy;
      });
      if(points.length>1){
        const upper=[],lower=[];
        points.forEach((p,i)=>{
          const before=points[Math.max(0,i-1)],after=points[Math.min(points.length-1,i+1)];
          const dx=after.x-before.x,dy=after.y-before.y,len=Math.max(1,Math.hypot(dx,dy));
          const nx=-dy/len,ny=dx/len,half=.6+4.4*Math.max(0,1-p.life);
          upper.push({x:p.x+nx*half,y:p.y+ny*half});lower.push({x:p.x-nx*half,y:p.y-ny*half});
        });
        const first=points[0],lastPoint=points[points.length-1];
        const stripe=ctx.createLinearGradient(first.x,first.y,lastPoint.x,lastPoint.y);
        stripe.addColorStop(0,'rgba(217,4,41,0)');stripe.addColorStop(.28,'rgba(217,4,41,.55)');stripe.addColorStop(.7,'rgba(255,92,115,.82)');stripe.addColorStop(1,'rgba(255,255,255,.98)');
        ctx.fillStyle=stripe;ctx.beginPath();ctx.moveTo(upper[0].x,upper[0].y);
        for(let i=1;i<upper.length-1;i++){const m={x:(upper[i].x+upper[i+1].x)/2,y:(upper[i].y+upper[i+1].y)/2};ctx.quadraticCurveTo(upper[i].x,upper[i].y,m.x,m.y);}
        ctx.lineTo(upper.at(-1).x,upper.at(-1).y);ctx.lineTo(lower.at(-1).x,lower.at(-1).y);
        for(let i=lower.length-2;i>0;i--){const m={x:(lower[i].x+lower[i-1].x)/2,y:(lower[i].y+lower[i-1].y)/2};ctx.quadraticCurveTo(lower[i].x,lower[i].y,m.x,m.y);}
        ctx.lineTo(lower[0].x,lower[0].y);ctx.closePath();ctx.fill();
      }
      raf=points.length?requestAnimationFrame(drawTail):0;
    };
    addEventListener('pointermove',e=>{
      const now={x:e.clientX,y:e.clientY};
      if(last){
        const dx=now.x-last.x,dy=now.y-last.y,steps=Math.min(7,Math.max(1,Math.ceil(Math.hypot(dx,dy)/10)));
        const angle=Math.atan2(dy,dx);
        for(let i=1;i<=steps;i++) points.push({x:last.x+dx*i/steps,y:last.y+dy*i/steps,vx:-dx*.008,vy:-dy*.008,angle,life:i/steps*.09});
      }else points.push({x:now.x,y:now.y,vx:0,vy:0,angle:0,life:0});
      last=now; if(points.length>90)points.splice(0,points.length-90); if(!raf)raf=requestAnimationFrame(drawTail);
    },{passive:true});
    addEventListener('pointerout',e=>{if(!e.relatedTarget)last=null;});
    addEventListener('resize',resizeTail,{passive:true}); resizeTail();
  }
  readHash(); render();
  if(shouldShowWelcome())requestAnimationFrame(()=>{
      const welcome=$('#welcome-dialog');
      welcome.showModal();
      welcome.focus({preventScroll:true});
    });
})();
