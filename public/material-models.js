// Lightweight orthographic models. All geometry uses x (length), y (depth), z (height).
(() => {
  const steel = [162, 188, 190];
  const add = (a,b) => a.map((n,i) => n+b[i]);
  const sub = (a,b) => a.map((n,i) => n-b[i]);
  const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const scale = (a,k) => a.map(n => n*k);
  const unit = a => scale(a,1/(Math.hypot(...a)||1));
  function model(sku) {
    const faces = [];
    function prism(start,end,profile,color=steel) {
      const axis = unit(sub(end,start));
      const side = unit(cross(Math.abs(axis[2])>.98?[0,1,0]:[0,0,1],axis));
      const up = cross(axis,side);
      const ring = origin => profile.map(([s,h]) => add(origin,add(scale(side,s),scale(up,h))));
      const a=ring(start), b=ring(end);
      faces.push([a,color],[b,color]);
      a.forEach((v,i) => {const j=(i+1)%a.length;faces.push([[v,a[j],b[j],b[i]],color]);});
    }
    function beam(a,b,w=.11,h=w,color) {
      prism(a,b,[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]],color);
    }
    const channel = [[-.48,-.45],[.45,-.45],[.45,-.25],[.38,-.25],[.38,-.38],[-.40,-.38],[-.40,.38],[.38,.38],[.38,.25],[.45,.25],[.45,.45],[-.48,.45]];
    const section = (p,y=0,len=4) => prism([-len/2,y,0],[len/2,y,0],p);
    function truss(y,pitched) {
      const top=x=>pitched?1.35*(1-Math.abs(x)/2.5)+.15:.80;
      beam([-2.5,y,0],[2.5,y,0]);
      for(let i=0;i<6;i++){
        const x=-2.5+i*5/6, n=x+5/6;
        beam([x,y,top(x)],[n,y,top(n)]);
        beam([x,y,i%2?0:top(x)],[n,y,i%2?top(n):0],.065);
      }
      for(const x of [-2.5,2.5]) beam([x,y,0],[x,y,top(x)]);
    }
    function frame(y,roof=true) {
      for(const x of [-2,2]) beam([x,y,0],[x,y,1.6],.15);
      if(roof) for(const x of [-2,2]) beam([x,y,1.6],[0,y,2.45],.16);
      else beam([-2,y,1.6],[2,y,1.6],.15);
      beam([-2,y,0],[2,y,0]);
    }
    switch(sku) {
      case 'MAT-CARBON': case 'MAT-HSLA': case 'MAT-ALLOY':
      case 'MAT-STAINLESS': case 'MAT-WEATHER': case 'MAT-COATED': {
        const color = {'MAT-WEATHER':[159,96,67],'MAT-STAINLESS':[194,205,208],'MAT-COATED':[130,153,161]}[sku] || steel;
        for(let i=0;i<3;i++) beam([-1.65,i*.12,i*.10],[1.65,i*.12,i*.10],1.4,.085,color);
        break;
      }
      case 'FOUND-PILE':
        section([[-1,0],[-.55,0],[-.30,.45],[.30,.45],[.55,0],[1,0],[1,-.06],[.51,-.06],[.26,.39],[-.26,.39],[-.51,-.06],[-1,-.06]]);break;
      case 'RC-TENDON': {
        for(let i=0;i<7;i++) {
          const a=i*Math.PI/3, r=i===6?0:.17;
          sectionWire(r*Math.cos(a),r*Math.sin(a));
        }
        function sectionWire(y,z) {
          prism([-2,y,z],[2,y,z],Array.from({length:10},(_,i)=>[.09*Math.cos(i*Math.PI/5),.09*Math.sin(i*Math.PI/5)]));
        }
        break;
      }
      case 'RC-FIBER':
        for(let i=0;i<5;i++) {
          const y=i*.36;
          beam([-1.4,y,0],[-1.15,y+.16,0],.045);beam([-1.15,y+.16,0],[1.15,y+.16,0],.045);beam([1.15,y+.16,0],[1.4,y+.32,0],.045);
        }break;
      case 'STRUCT-BOLT':
        for(const y of [-.5,.5]) for(const [start,end,r,n] of [[-1.4,1.2,.18,12],[1.2,1.5,.35,6]])
          prism([start,y,0],[end,y,0],Array.from({length:n},(_,i)=>[r*Math.cos(i*2*Math.PI/n),r*Math.sin(i*2*Math.PI/n)]));
        break;
      case 'ARCH-GRID':
        for(let i=0;i<8;i++) beam([-1.6,i*.21,0],[1.6,i*.21,0],.055,.18);
        for(let i=0;i<6;i++) beam([-1.5+i*.6,0,.06],[-1.5+i*.6,1.47,.06],.045);break;
      case 'ARCH-OPEN':
        for(const x of [-.72,.72]) beam([x,0,0],[x,0,2.6],.1);
        beam([-.77,0,2.6],[.77,0,2.6],.1);
        beam([-.66,.04,1.28],[.66,.04,1.28],.06,2.54);
        beam([.43,-.06,1.18],[.60,-.06,1.18],.06);break;
      case 'MEP-PIPE':
        for(let i=0;i<18;i++) {
          const a=i*Math.PI/9,b=(i+1)*Math.PI/9;
          section([[.56,a],[.56,b],[.48,b],[.48,a]].map(([r,t])=>[r*Math.cos(t),r*Math.sin(t)]));
        }break;
      case 'MEP-DUCT':
        for(const z of [-.46,.46]) beam([-1.7,0,z],[1.7,0,z],1.38,.04);
        for(const y of [-.67,.67]) beam([-1.7,y,0],[1.7,y,0],.04,.89);break;
      case 'CFS-STUD': section(channel); break;
      case 'CFS-TRACK': section([[-.55,.45],[-.55,-.45],[.55,-.45],[.55,.45],[.47,.45],[.47,-.37],[-.47,-.37],[-.47,.45]]); break;
      case 'CFS-JOIST': truss(0,true); break;
      case 'STEEL-LONG': truss(0,false); break;
      case 'CFS-PANEL':
        frame(0,false);
        for(const x of [-1.5,-1,-.5,0,.5,1,1.5]) beam([x,0,0],[x,0,1.6],.085,.15);
        break;
      case 'STEEL-KIT': case 'STEEL-PEMB': case 'STEEL-MOD': {
        const roof=sku!=='STEEL-MOD';
        for(const y of [-1.4,0,1.4]) frame(y,roof);
        for(const x of [-2,2]) for(const z of [0,1.6]) beam([x,-1.4,z],[x,1.4,z]);
        if(roof) for(const x of [-1,0,1]) beam([x,-1.4,2.45-.425*Math.abs(x)],[x,1.4,2.45-.425*Math.abs(x)],.085);
        if(sku==='STEEL-KIT') for(const y of [-1.4,1.4]) for(const x of [-1.5,-1,-.5,0,.5,1,1.5]) beam([x,y,0],[x,y,1.6],.055);
        if(sku==='STEEL-MOD') for(const y of [-1.4,1.4]) beam([-2,y,0],[0,y,1.6],.085);
        break;
      }
      case 'STRUCT-W': section([[-.58,-.58],[.58,-.58],[.58,-.45],[.07,-.45],[.07,.45],[.58,.45],[.58,.58],[-.58,.58],[-.58,.45],[-.07,.45],[-.07,-.45],[-.58,-.45]]);break;
      case 'STRUCT-HSS':
        for(const z of [-.44,.44]) beam([-2,0,z],[2,0,z],1.1,.10);
        for(const y of [-.5,.5]) beam([-2,y,0],[2,y,0],.10,.78);
        break;
      case 'STRUCT-PL':
        beam([-1.8,0,0],[1.8,0,0],1.8,.13);
        prism([-.8,-.22,.08],[-.8,.22,.08],[[0,0],[-1.5,0],[0,1.2]]);
        break;
      case 'CFS-CONNECT':
        section([[-.62,.65],[-.62,-.50],[.7,-.50],[.7,-.38],[-.50,-.38],[-.50,.65]],0,2.7);
        for(const x of [-.83,.83]) prism([x,.20,-.64],[x,.20,-.30],Array.from({length:6},(_,i)=>[.17*Math.cos(i*Math.PI/3),.17*Math.sin(i*Math.PI/3)]));
        break;
      case 'RC-BAR': {
        const round=Array.from({length:10},(_,i)=>[.065*Math.cos(i*Math.PI/5),.065*Math.sin(i*Math.PI/5)]);
        for(const y of [-.9,-.3,.3,.9]) prism([-2,y,0],[2,y,0],round);
        for(let x=-1.8;x<2;x+=.6) prism([x,-1.15,.12],[x,1.15,.12],round);
        break;
      }
      case 'STEEL-DECK': case 'STEEL-CLAD': {
        const edge=[];
        for(let i=0;i<4;i++) {
          const y=-1.2+i*.6;
          edge.push([y,0],[y+.10,.24],[y+(sku==='STEEL-DECK'?.34:.14),.24],[y+(sku==='STEEL-DECK'?.44:.22),0]);
        }
        edge.push([1.2,0]);section([...edge,...edge.slice().reverse().map(([y,z])=>[y,z-.045])]);break;
      }
      case 'STEEL-SECOND': section([[-.7,.55],[.04,.55],[.04,-.46],[.70,-.46],[.70,-.55],[-.05,-.55],[-.05,.46],[-.7,.46]]);break;
      case 'STEEL-SPECIAL':
        [[185,201,205],[157,94,64],[138,163,161]].forEach((c,i)=>beam([-1.45,i*.77,0],[1.45,i*.77,0],.67,.12,c));break;
    }
    return faces;
  }
  for(const card of document.querySelectorAll('.product-card')) {
    const faces=model(card.querySelector('[data-sku]').dataset.sku);
    if(!faces.length) continue;
    const holder=card.querySelector('.product-drawing');
    const canvas=document.createElement('canvas'), ctx=canvas.getContext('2d');
    if(!ctx) continue;
    const title=card.querySelector('h3').textContent;
    canvas.setAttribute('role','img');canvas.setAttribute('aria-label','3D example of '+title);
    const rotate=document.createElement('button');
    rotate.type='button';rotate.textContent='Rotate 3D ↻';rotate.setAttribute('aria-label','Rotate 3D example of '+title);
    holder.replaceChildren(canvas,rotate);holder.classList.add('model-view');
    let angle=-.73;
    function draw() {
      const w=holder.clientWidth,h=holder.clientHeight;
      if(!w||!h) return;
      const d=Math.min(window.devicePixelRatio||1,2);
      canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);
      const c=Math.cos(angle),s=Math.sin(angle);
      const project=([x,y,z])=>{const depth=s*x+c*y;return [c*x-s*y,.43*depth-.90*z,.90*depth+.43*z];};
      const polys=faces.map(([vertices,color])=>{
        const p=vertices.map(project), n=unit(cross(sub(p[1],p[0]),sub(p[2],p[0])));
        if(n[2]<0) n.forEach((v,i)=>n[i]=-v);
        const light=.70+.35*(-.38*n[0]-.69*n[1]+.60*n[2]);
        return {p,depth:p.reduce((a,v)=>a+v[2],0)/p.length,color:'rgb('+color.map(k=>Math.round(k*light)).join(',')+')'};
      }).sort((a,b)=>a.depth-b.depth);
      const points=polys.flatMap(f=>f.p), xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
      const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
      const zoom=.67*Math.min((w-40)/(maxX-minX),(h-48)/(maxY-minY));
      ctx.translate(w/2-zoom*(minX+maxX)/2,(h-18)/2-zoom*(minY+maxY)/2);
      for(const f of polys) {
        ctx.beginPath();f.p.forEach(([x,y],i)=>i?ctx.lineTo(x*zoom,y*zoom):ctx.moveTo(x*zoom,y*zoom));ctx.closePath();
        ctx.fillStyle=f.color;ctx.fill();ctx.strokeStyle='rgba(42,70,73,.72)';ctx.lineWidth=.65;ctx.stroke();
      }
    }
    rotate.onclick=()=>{angle+=Math.PI/6;draw();};
    new ResizeObserver(draw).observe(holder);
  }
})();
