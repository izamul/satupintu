(() => {
  'use strict';
  const stage=document.querySelector('#game-stage');
  const startButton=document.querySelector('#game-start');
  const overlay=document.querySelector('#game-overlay');
  const message=document.querySelector('#game-message');
  const scoreEl=document.querySelector('#game-score');
  const bestEl=document.querySelector('#game-best');
  const speedEl=document.querySelector('#game-speed');
  const gameDialog=document.querySelector('#game-dialog');
  if(!stage || !window.THREE){
    if(message)message.textContent='Game perlu koneksi internet untuk memuat mesin 3D.';
    if(startButton)startButton.hidden=true;
    return;
  }

  const THREE=window.THREE;
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0xddebe2);
  scene.fog=new THREE.Fog(0xddebe2,14,29);
  const camera=new THREE.PerspectiveCamera(48,1,.1,60);
  camera.position.set(0,4.3,9.4); camera.lookAt(0,.8,0);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  stage.prepend(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xffffff,0x8d0014,2.1));
  const sun=new THREE.DirectionalLight(0xffffff,3.3); sun.position.set(-5,8,6); sun.castShadow=true; scene.add(sun);
  const groundMaterial=new THREE.MeshStandardMaterial({color:0xb8c99e,roughness:.9});
  const ground=new THREE.Mesh(new THREE.BoxGeometry(60,.28,4.2),groundMaterial);
  ground.position.set(10,-.22,0); ground.receiveShadow=true; scene.add(ground);
  const lane=new THREE.Mesh(new THREE.PlaneGeometry(60,.06),new THREE.MeshBasicMaterial({color:0xd90429}));
  lane.rotation.x=-Math.PI/2; lane.position.set(10,-.07,1.88); scene.add(lane);

  const scenery=[];
  const trunkGeometry=new THREE.CylinderGeometry(.11,.16,1,7);
  const crownGeometry=new THREE.ConeGeometry(.62,1.35,8);
  const bushGeometry=new THREE.DodecahedronGeometry(.38,0);
  const trunkMaterial=new THREE.MeshStandardMaterial({color:0x765436,roughness:1,flatShading:true});
  const greenColors=[0x356b3f,0x477f4d,0x5f9257,0x78a568].map(color=>new THREE.Color(color));
  const burntColors=[0x302925,0x3b3028,0x49382c,0x55402f].map(color=>new THREE.Color(color));
  const foliage=greenColors.map(color=>new THREE.MeshStandardMaterial({color,roughness:1,flatShading:true}));
  const fires=[];
  const flameOuterMaterial=new THREE.MeshStandardMaterial({color:0xff5a00,emissive:0xaa1600,emissiveIntensity:1.5,roughness:.5});
  const flameInnerMaterial=new THREE.MeshBasicMaterial({color:0xffd447});
  const makeTree=(scale,colorIndex)=>{
    const tree=new THREE.Group();
    const trunk=new THREE.Mesh(trunkGeometry,trunkMaterial);trunk.position.y=.48;tree.add(trunk);
    const lower=new THREE.Mesh(crownGeometry,foliage[colorIndex%foliage.length]);lower.position.y=1.2;tree.add(lower);
    const upper=new THREE.Mesh(crownGeometry,foliage[(colorIndex+1)%foliage.length]);upper.scale.set(.72,.7,.72);upper.position.y=1.85;tree.add(upper);
    const bush=new THREE.Mesh(bushGeometry,foliage[(colorIndex+2)%foliage.length]);bush.scale.set(1.25,.65,.75);bush.position.set(.52,.22,.08);tree.add(bush);
    const flame=new THREE.Group();
    const outer=new THREE.Mesh(new THREE.ConeGeometry(.3,.96,7),flameOuterMaterial);outer.position.y=.48;flame.add(outer);
    const inner=new THREE.Mesh(new THREE.ConeGeometry(.15,.62,7),flameInnerMaterial);inner.position.set(.04,.35,.14);flame.add(inner);
    const sideFlame=new THREE.Mesh(new THREE.ConeGeometry(.21,.7,7),flameOuterMaterial);sideFlame.position.set(.32,.34,.02);sideFlame.rotation.z=-.18;flame.add(sideFlame);
    const sideCore=new THREE.Mesh(new THREE.ConeGeometry(.1,.4,7),flameInnerMaterial);sideCore.position.set(.34,.25,.13);sideCore.rotation.z=-.18;flame.add(sideCore);
    flame.position.set(-.16,.92,.32);flame.visible=false;tree.add(flame);fires.push(flame);
    tree.scale.setScalar(scale);return tree;
  };
  const addTreeLayer=(count,z,scaleMin,scaleMax,speedFactor,offset)=>{
    const span=27;
    for(let i=0;i<count;i++){
      const tree=makeTree(scaleMin+Math.random()*(scaleMax-scaleMin),i+offset);
      tree.position.set(-11+i*(span/count)+Math.random()*.7,0,z+Math.random()*.18);
      scene.add(tree);scenery.push({tree,speedFactor,span});
    }
  };
  addTreeLayer(11,-4.4,.58,.86,.09,2);
  addTreeLayer(9,-2.3,.72,1.08,.18,0);

  const cloudMaterial=new THREE.MeshStandardMaterial({color:0x211d20,roughness:1,transparent:true,opacity:0});
  const clouds=new THREE.Group();clouds.position.set(0,3.65,-3.1);scene.add(clouds);
  [-6,-2,2.3,6.2].forEach((x,i)=>{
    const cloud=new THREE.Group();
    [[0,0,.62],[.55,.03,.48],[-.52,.02,.43],[.15,.27,.42]].forEach(([cx,cy,size])=>{const puff=new THREE.Mesh(new THREE.SphereGeometry(size,9,7),cloudMaterial);puff.position.set(cx,cy,0);cloud.add(puff);});
    cloud.position.set(x,i%2*.28,0);cloud.scale.setScalar(.8+(i%3)*.12);clouds.add(cloud);
  });
  const rainCount=190,rainPositions=new Float32Array(rainCount*6);
  for(let i=0;i<rainCount;i++){const p=i*6,x=-9+Math.random()*18,y=Math.random()*6,z=-1.4+Math.random()*5;rainPositions[p]=x;rainPositions[p+1]=y;rainPositions[p+2]=z;rainPositions[p+3]=x+.035;rainPositions[p+4]=y-.58;rainPositions[p+5]=z;}
  const rainGeometry=new THREE.BufferGeometry();rainGeometry.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));
  const rain=new THREE.LineSegments(rainGeometry,new THREE.LineBasicMaterial({color:0x55bce9,transparent:true,opacity:.92}));rain.visible=false;scene.add(rain);
  const waterMaterial=new THREE.MeshBasicMaterial({color:0x58b9d8,transparent:true,opacity:0,depthWrite:false});
  const water=new THREE.Mesh(new THREE.PlaneGeometry(60,4.1),waterMaterial);water.rotation.x=-Math.PI/2;water.position.set(10,-.045,0);water.visible=false;scene.add(water);
  const splashMaterial=new THREE.MeshBasicMaterial({color:0xbcecff,transparent:true,opacity:.8});
  const splashes=[];
  for(let i=0;i<14;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.13,.018,5,18),splashMaterial);ring.rotation.x=Math.PI/2;ring.position.set(-7+Math.random()*15,-.01,-1.4+Math.random()*3.1);ring.visible=false;scene.add(ring);splashes.push(ring);}
  let fireIntensity=0,rainTimer=0,nextRainAt=500;
  const setForestState=value=>{
    fireIntensity=Math.max(0,Math.min(1,value));
    foliage.forEach((material,i)=>material.color.copy(greenColors[i]).lerp(burntColors[i],fireIntensity));
    groundMaterial.color.set(0xb8c99e).lerp(new THREE.Color(0x665342),fireIntensity*.78);
  };
  const beginRain=()=>{rainTimer=3.2;rain.visible=true;water.visible=true;splashes.forEach(ring=>ring.visible=true);setForestState(0);};
  const resetWorld=()=>{rainTimer=0;nextRainAt=500;rain.visible=false;water.visible=false;waterMaterial.opacity=0;splashes.forEach(ring=>ring.visible=false);clouds.visible=false;setForestState(0);fires.forEach(flame=>flame.visible=false);};
  const updateWorld=(dt,now)=>{
    if(running&&score>=nextRainAt&&nextRainAt<=2000){nextRainAt+=500;beginRain();}
    if(rainTimer>0){
      rainTimer=Math.max(0,rainTimer-dt);rain.visible=true;
      const positions=rainGeometry.attributes.position.array;
      for(let i=0;i<rainCount;i++){const p=i*6;positions[p+1]-=dt*10.5;positions[p+4]-=dt*10.5;if(positions[p+4]<0){const y=5.5+Math.random();positions[p+1]=y;positions[p+4]=y-.58;}}
      rainGeometry.attributes.position.needsUpdate=true;
      water.visible=true;waterMaterial.opacity=.22+Math.sin(now*.009)*.055;
      splashes.forEach((ring,i)=>{ring.visible=true;const pulse=.45+((now*.0025+i*.17)%1)*2.2;ring.scale.setScalar(pulse);});
      if(rainTimer===0){rain.visible=false;water.visible=false;splashes.forEach(ring=>ring.visible=false);}
    }else if(running){
      const cycleStart=nextRainAt-500;
      setForestState(Math.min(.95,Math.max(0,(score-cycleStart)/500)));
    }
    const cloudStrength=rainTimer>0?.88:fireIntensity*.82;
    clouds.visible=cloudStrength>.04;cloudMaterial.opacity=cloudStrength;clouds.position.x=Math.sin(now*.00022)*1.2;
    fires.forEach((flame,i)=>{
      const strength=rainTimer>0?0:.28+fireIntensity*1.2;
      flame.visible=strength>.02;
      const flicker=.82+Math.sin(now*.012+i*1.7)*.16;
      flame.scale.set(strength*flicker,strength*(.8+flicker*.35),strength*flicker);
    });
  };

  const player=new THREE.Group(); player.position.set(-3.25,0,0); scene.add(player);
  const sackMat=new THREE.MeshStandardMaterial({color:0xc99558,roughness:.88});
  const sack=new THREE.Mesh(new THREE.CylinderGeometry(.43,.62,1.1,10,1),sackMat); sack.position.y=.55; sack.castShadow=true; player.add(sack);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.43,.05,7,20),new THREE.MeshStandardMaterial({color:0x8d0014,roughness:.7})); rim.position.y=1.07; rim.rotation.x=Math.PI/2; player.add(rim);
  const shirtMat=new THREE.MeshStandardMaterial({color:0xd90429,roughness:.75});
  const skinMat=new THREE.MeshStandardMaterial({color:0xd89568,roughness:.8});
  const bandMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.7});
  const torso=new THREE.Mesh(new THREE.BoxGeometry(.62,.62,.38),shirtMat);torso.position.y=1.34;torso.castShadow=true;player.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.32,16,12),skinMat); head.position.y=1.82; head.castShadow=true; player.add(head);
  const band=new THREE.Mesh(new THREE.BoxGeometry(.7,.09,.38),bandMat); band.position.set(0,1.88,.08); player.add(band);
  [-1,1].forEach(side=>{const arm=new THREE.Mesh(new THREE.CylinderGeometry(.07,.08,.58,8),skinMat);arm.position.set(side*.42,1.33,.02);arm.rotation.z=side*-.58;arm.castShadow=true;player.add(arm);const hand=new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),skinMat);hand.position.set(side*.57,1.12,.02);player.add(hand);});
  const eyeMat=new THREE.MeshBasicMaterial({color:0x1c1113});
  [-.11,.11].forEach(x=>{const eye=new THREE.Mesh(new THREE.SphereGeometry(.03,8,6),eyeMat);eye.position.set(x,1.86,.29);player.add(eye);});
  const skins=[
    {shirt:0xd90429,sack:0xc99558,skin:0xd89568,band:0xffffff},
    {shirt:0x2d6a4f,sack:0x765436,skin:0x8d5524,band:0xf4d35e},
    {shirt:0x1d5fa7,sack:0xd2a679,skin:0xf0b78a,band:0xffffff}
  ];
  const skinButtons=[...document.querySelectorAll('[data-skin]')];
  const applySkin=index=>{const s=skins[index]||skins[0];shirtMat.color.setHex(s.shirt);sackMat.color.setHex(s.sack);skinMat.color.setHex(s.skin);bandMat.color.setHex(s.band);skinButtons.forEach((b,i)=>b.setAttribute('aria-checked',String(i===index)));try{localStorage.setItem('lompat-karung-skin',String(index))}catch{}};
  skinButtons.forEach((button,index)=>button.addEventListener('click',()=>applySkin(index)));
  let savedSkin=0;try{savedSkin=Number(localStorage.getItem('lompat-karung-skin')||0)}catch{}applySkin(savedSkin);

  const issues=['KORUPSI','NARKOBA','HOAKS','PUNGLI','JUDI ONLINE','INTOLERANSI'];
  const obstacles=[];
  const makeLabel=text=>{
    const c=document.createElement('canvas'); c.width=384;c.height=96;const x=c.getContext('2d');
    x.fillStyle='#1c1113';x.fillRect(0,0,c.width,c.height);x.strokeStyle='#ffffff';x.lineWidth=5;x.strokeRect(4,4,c.width-8,c.height-8);
    x.fillStyle='#ffffff';x.font='700 30px Poppins,Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(text,c.width/2,c.height/2+2);
    const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map,transparent:true}));sprite.scale.set(2.25,.56,1);return sprite;
  };
  const spawnObstacle=()=>{
    const group=new THREE.Group(); const size=.48+Math.random()*.22;
    const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(size,0),new THREE.MeshStandardMaterial({color:0x5d5050,roughness:1,flatShading:true}));
    rock.scale.y=.78+Math.random()*.38;rock.rotation.set(Math.random(),Math.random(),Math.random());rock.castShadow=true;group.add(rock);
    const label=makeLabel(issues[Math.floor(Math.random()*issues.length)]);label.position.y=1.25;group.add(label);
    group.position.set(8.5,size*.65,0);scene.add(group);obstacles.push({group,rock,passed:false,size});
  };

  let running=false,vy=0,elapsed=0,score=0,last=performance.now(),spawnIn=1.2,frameId=0;
  let best=0;try{best=Number(localStorage.getItem('lompat-karung-best')||0)}catch{}bestEl.textContent=String(best).padStart(4,'0');
  const clearObstacles=()=>{while(obstacles.length){const o=obstacles.pop();scene.remove(o.group);}};
  const jump=()=>{if(!running)return;if(player.position.y<=.025)vy=8.8;};
  const start=()=>{clearObstacles();resetWorld();running=true;elapsed=0;score=0;vy=0;spawnIn=1.45;player.position.y=0;scoreEl.textContent='0000';speedEl.textContent='1.0×';overlay.hidden=true;stage.focus();};
  const gameOver=()=>{
    running=false;best=Math.max(best,score);try{localStorage.setItem('lompat-karung-best',String(best))}catch{}
    bestEl.textContent=String(best).padStart(4,'0');message.textContent=`Tersandung. Skor ${score}.`;startButton.textContent='Main lagi';overlay.hidden=false;
  };
  const win=()=>{
    running=false;score=2500;scoreEl.textContent='2500';best=Math.max(best,score);try{localStorage.setItem('lompat-karung-best',String(best))}catch{}
    bestEl.textContent=String(best).padStart(4,'0');clearObstacles();beginRain();message.textContent='Selamat, kamu berhasil menyelamatkan hutan!';startButton.textContent='Main lagi';overlay.hidden=false;
  };
  resetWorld();
  startButton.addEventListener('click',start);
  stage.addEventListener('pointerdown',e=>{if(e.target===startButton)return;jump();});
  addEventListener('keydown',e=>{if(e.code==='Space' && (running || document.activeElement===stage)){e.preventDefault();jump();}});

  const resize=()=>{const r=stage.getBoundingClientRect();camera.aspect=r.width/Math.max(1,r.height);camera.updateProjectionMatrix();renderer.setSize(r.width,r.height,false);};
  new ResizeObserver(resize).observe(stage);resize();
  const pauseLoop=()=>{if(frameId){cancelAnimationFrame(frameId);frameId=0;}};
  const resumeLoop=()=>{if(frameId||document.hidden||!gameDialog.open)return;last=performance.now();frameId=requestAnimationFrame(tick);};
  addEventListener('satupintu-game-open',()=>requestAnimationFrame(()=>{resize();resumeLoop();}));
  document.addEventListener('visibilitychange',()=>{document.hidden?pauseLoop():resumeLoop();});
  gameDialog.addEventListener('close',()=>{pauseLoop();running=false;clearObstacles();resetWorld();player.position.y=0;vy=0;message.textContent='Siap melewati masalah?';startButton.textContent='Mulai main';overlay.hidden=false;});
  const tick=now=>{
    frameId=requestAnimationFrame(tick);const dt=Math.min(.033,(now-last)/1000);last=now;
    if(running){
      elapsed+=dt;const speed=4.25+elapsed*.14;spawnIn-=dt;
      scenery.forEach(item=>{item.tree.position.x-=speed*item.speedFactor*dt;if(item.tree.position.x<-12)item.tree.position.x+=item.span;});
      if(spawnIn<=0){spawnObstacle();spawnIn=Math.max(.95,1.95-speed*.05)+Math.random()*.58;}
      vy-=17.8*dt;player.position.y=Math.max(0,player.position.y+vy*dt);if(player.position.y===0)vy=0;
      sack.rotation.z=Math.sin(elapsed*11)*.055;player.rotation.z=player.position.y>0?-.09:Math.sin(elapsed*12)*.025;
      for(let i=obstacles.length-1;i>=0;i--){const o=obstacles[i];o.group.position.x-=speed*dt;o.rock.rotation.z-=dt*2.2;
        if(!o.passed&&o.group.position.x<player.position.x){o.passed=true;score+=35;}
        if(Math.abs(o.group.position.x-player.position.x)<.68+o.size*.25 && player.position.y<.72+o.size*.55){gameOver();break;}
        if(o.group.position.x<-8){scene.remove(o.group);obstacles.splice(i,1);}
      }
      score=Math.max(score,Math.floor(elapsed*10));scoreEl.textContent=String(score).padStart(4,'0');speedEl.textContent=(speed/4.25).toFixed(1)+'×';
      if(running&&score>=2500)win();
    }else{player.rotation.z=Math.sin(now*.002)*.018;}
    updateWorld(dt,now);
    renderer.render(scene,camera);
  };
})();
