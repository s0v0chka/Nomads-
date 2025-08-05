/* ---------- SIMPLE STARFIELD ---------- */
const canvas = document.getElementById('stars'), ctx = canvas.getContext('2d');
let stars = [];
function resize(){canvas.width=innerWidth;canvas.height=innerHeight;}
function init(){
    stars = Array.from({length:120},()=>({
        x:Math.random()*canvas.width,
        y:Math.random()*canvas.height,
        size:Math.random()*2,
        speed:0.3+Math.random()*0.7
    }));
}
function animate(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#ffffff";
    stars.forEach(s=>{
        ctx.fillRect(s.x,s.y,s.size,s.size);
        s.y -= s.speed;
        if(s.y<0){s.y=canvas.height;s.x=Math.random()*canvas.width;}
    });
    requestAnimationFrame(animate);
}
window.addEventListener('resize',()=>{resize();init();});
resize();init();animate();
