/* Subtle procedural water; one low-resolution GPU surface, desktop only. */
(() => {
  const desktop = matchMedia('(min-width: 1000px) and (hover: hover) and (pointer: fine)');
  let dispose = null;
  function start() {
    const canvas = document.createElement('canvas');
    canvas.className = 'background-waves';
    canvas.setAttribute('aria-hidden', 'true');
    const gl = canvas.getContext('webgl', {alpha:true, antialias:false, depth:false, stencil:false, premultipliedAlpha:false, powerPreference:'low-power'});
    if (!gl) return;
    const shaders = [];
    function shader(type, source) {
      const item = gl.createShader(type);
      shaders.push(item); gl.shaderSource(item, source); gl.compileShader(item);
      if (!gl.getShaderParameter(item, gl.COMPILE_STATUS)) throw Error('Wave shader unavailable');
      return item;
    }
    let program, buffer;
    try {
      program = gl.createProgram();
      gl.attachShader(program, shader(gl.VERTEX_SHADER, `attribute vec2 position; void main(){gl_Position=vec4(position,0.,1.);}`));
      gl.attachShader(program, shader(gl.FRAGMENT_SHADER, `
        #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
        #else
        precision mediump float;
        #endif
        uniform vec2 resolution;
        uniform vec2 viewport;
        uniform float scrollOffset;
        uniform float time;
        uniform vec3 pointer;
        uniform vec3 lineColor;
        // xy: document position; z: birth time; w: move (1) / click (2).
        uniform vec4 drops[12];
        void main(){
          vec2 uv=gl_FragCoord.xy/resolution;
          vec2 p=vec2(uv.x*viewport.x,(1.-uv.y)*viewport.y+scrollOffset)/800.;
          float disturbance=0.;
          float rings=0.;
          for(int i=0;i<12;i++){
            float age=time-drops[i].z;
            if(drops[i].w>.5 && age>=0. && age<4.5){
              float click=step(1.5,drops[i].w);
              float radius=age*mix(.13,.23,click);
              float d=length(p-drops[i].xy);
              float delta=d-radius;
              float fade=(1.-smoothstep(1.,4.5,age))*smoothstep(0.,.12,age);
              float ring=1.-smoothstep(.0012,.0025,abs(delta));
              float echo=(1.-smoothstep(.0012,.0025,abs(d-radius*.72)))*click;
              rings=max(rings,max(ring,echo)*fade);
              disturbance+=sin(delta*95.)*exp(-abs(delta)*23.)*fade*mix(.25,.7,click);
            }
          }
          // Dense paired contours: woodcut-inspired wave bands, ~18px pitch.
          float flow=p.y*280.+time*1.6;
          float swell=sin(p.x*13.+p.y*3.5-time*.2)*8.;
          swell+=sin(p.x*23.-p.y*5.+time*.16)*2.5;
          float phase=flow+swell+disturbance*2.;
          float crest=1.-smoothstep(.10,.24,abs(sin(phase*.5)));
          float secondPhase=phase+1.8+sin(p.x*9.+p.y*2.-time*.12)*.45;
          float crossWave=1.-smoothstep(.075,.19,abs(sin(secondPhase*.5)));
          float lines=max(max(crest,crossWave),rings);
          float nearPointer=(1.-smoothstep(0.,.3,length(p-pointer.xy)))*pointer.z;
          float opacity=mix(.02,.05,nearPointer);
          gl_FragColor=vec4(lineColor,lines*opacity);
        }`));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('Wave program unavailable');
      gl.useProgram(program);
      buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const attr=gl.getAttribLocation(program,'position');
      gl.enableVertexAttribArray(attr); gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
    } catch (_) {
      shaders.forEach(s=>gl.deleteShader(s)); if(program)gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext(); return;
    }
    const uniforms=Object.fromEntries(['resolution','viewport','scrollOffset','time','pointer','lineColor','drops[0]'].map(key=>[key,gl.getUniformLocation(program,key)]));
    let frame=0, last=0, elapsed=0, contextLost=false;
    const drops=new Float32Array(12*4);
    let mouseX=0,mouseY=0,mouseActive=0,mouseFade=0;
    let moveSlot=0, clickSlot=8, lastDrop=-Infinity, lastX=-Infinity, lastY=-Infinity;
    function resize(){
      const scale=Math.min(devicePixelRatio || 1,1.5);
      canvas.width=Math.max(1,Math.round(innerWidth*scale));
      canvas.height=Math.max(1,Math.round(innerHeight*scale));
      gl.viewport(0,0,canvas.width,canvas.height);
    }
    function addDrop(e,click){
      const slot=click?clickSlot:moveSlot;
      drops.set([e.clientX/800,(e.clientY+scrollY)/800,elapsed,click?2:1],slot*4);
      if(click)clickSlot=8+(clickSlot-8+1)%4;else moveSlot=(moveSlot+1)%8;
    }
    function move(e){
      if(e.pointerType!=='mouse')return;
      mouseX=e.clientX;mouseY=e.clientY;mouseActive=1;
      if(elapsed-lastDrop<.10 || Math.hypot(e.clientX-lastX,e.clientY-lastY)<22)return;
      addDrop(e,false);lastDrop=elapsed;lastX=e.clientX;lastY=e.clientY;
    }
    function click(e){if(e.pointerType==='mouse' && e.button===0){mouseX=e.clientX;mouseY=e.clientY;mouseActive=1;addDrop(e,true);}}
    function leave(){mouseActive=0;}
    // Complement the actual section background in RGB space. Dark sections
    // receive light lines; warm cream/brown sections receive cool blue lines.
    const sections=Array.from(document.querySelectorAll('main > section, footer'));
    let bands=[];
    function measureBands(){
      bands=sections.map(section=>{
        const rect=section.getBoundingClientRect();
        let rgb;
        if(section.classList.contains('hero'))rgb=[41,41,39];
        else {
          let node=section;
          while(node){
            const color=getComputedStyle(node).backgroundColor;
            const values=color.match(/[\d.]+/g)?.map(Number);
            if(values && (values.length<4 || values[3]>0)){rgb=values.slice(0,3);break;}
            node=node.parentElement;
          }
        }
        rgb=rgb||[251,248,243];
        return {top:rect.top+scrollY,bottom:rect.bottom+scrollY,color:rgb.map(c=>1-c/255)};
      });
    }
    const observer=typeof ResizeObserver==='function'?new ResizeObserver(measureBands):null;
    sections.forEach(section=>observer?.observe(section));
    measureBands();
    function draw(now){
      frame=requestAnimationFrame(draw);
      if(now-last<32)return;
      const dt=last?Math.min((now-last)/1000,.08):.033;last=now;elapsed+=dt;
      gl.uniform2f(uniforms.resolution,canvas.width,canvas.height);
      gl.uniform2f(uniforms.viewport,innerWidth,innerHeight);
      gl.uniform1f(uniforms.scrollOffset,scrollY);gl.uniform1f(uniforms.time,elapsed);
      mouseFade+=(mouseActive-mouseFade)*(1-Math.exp(-dt*8));
      gl.uniform3f(uniforms.pointer,mouseX/800,(mouseY+scrollY)/800,mouseFade);
      gl.uniform4fv(uniforms['drops[0]'],drops);
      gl.disable(gl.SCISSOR_TEST);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.SCISSOR_TEST);
      for(const band of bands){
        const top=Math.max(0,band.top-scrollY),bottom=Math.min(innerHeight,band.bottom-scrollY);
        if(bottom<=top)continue;
        const y=Math.floor((innerHeight-bottom)/innerHeight*canvas.height);
        const end=Math.ceil((innerHeight-top)/innerHeight*canvas.height);
        gl.scissor(0,y,canvas.width,end-y);
        gl.uniform3f(uniforms.lineColor,...band.color);gl.drawArrays(gl.TRIANGLES,0,6);
      }
      gl.disable(gl.SCISSOR_TEST);
    }
    function visibility(){cancelAnimationFrame(frame);frame=0;last=0;if(!document.hidden&&!contextLost)frame=requestAnimationFrame(draw);}
    function lost(e){e.preventDefault();contextLost=true;cancelAnimationFrame(frame);canvas.style.visibility='hidden';}
    canvas.addEventListener('webglcontextlost',lost);
    document.body.prepend(canvas);resize();visibility();
    window.addEventListener('resize',resize);
    window.addEventListener('resize',measureBands);
    document.documentElement.addEventListener('pointerleave',leave);
    window.addEventListener('blur',leave);
    window.addEventListener('pointermove',move,{passive:true});
    window.addEventListener('pointerdown',click,{passive:true});
    document.addEventListener('visibilitychange',visibility);
    dispose=()=>{
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('resize',measureBands);
      document.documentElement.removeEventListener('pointerleave',leave);
      window.removeEventListener('blur',leave);
      window.removeEventListener('resize',resize);window.removeEventListener('pointermove',move);
      window.removeEventListener('pointerdown',click);
      document.removeEventListener('visibilitychange',visibility);
      canvas.removeEventListener('webglcontextlost',lost);canvas.remove();
      gl.deleteBuffer(buffer);shaders.forEach(s=>gl.deleteShader(s));gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }
  function sync(){if(dispose){dispose();dispose=null;}if(desktop.matches)start();}
  desktop.addEventListener('change',sync);sync();
})();
