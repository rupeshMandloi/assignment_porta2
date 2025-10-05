const API = {
  base: 'http://localhost:5000/api',
  async login(email, password){
    const res = await fetch(this.base + '/auth/login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({email, password})
    });
    if(!res.ok) throw await res.json();
    return res.json();
  },
  token(){
    const raw = localStorage.getItem('auth');
    if(!raw) return null;
    const auth = JSON.parse(raw);
    return auth.token;
  },
  async getAssignments(status){
    const q = status ? ('?status=' + encodeURIComponent(status)) : '';
    const res = await fetch(this.base + '/assignments' + q, { headers: { Authorization: 'Bearer ' + this.token() }});
    return res.json();
  },
  async createAssignment(data){
    const res = await fetch(this.base + '/assignments', {
      method: 'POST',
      headers: {'Content-Type':'application/json', Authorization: 'Bearer ' + this.token()},
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async updateAssignment(id, data){
    const res = await fetch(this.base + '/assignments/' + id, {
      method: 'PUT',
      headers: {'Content-Type':'application/json', Authorization: 'Bearer ' + this.token()},
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async changeStatus(id, action){
    const res = await fetch(this.base + '/assignments/' + id + '/status', {
      method: 'POST',
      headers: {'Content-Type':'application/json', Authorization: 'Bearer ' + this.token()},
      body: JSON.stringify({ action })
    });
    return res.json();
  },
  async deleteAssignment(id){
    const res = await fetch(this.base + '/assignments/' + id, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + this.token()}
    });
    return res.json();
  },
  async submitAnswer(id, answer){
    const res = await fetch(this.base + '/assignments/' + id + '/submit', {
      method: 'POST',
      headers: {'Content-Type':'application/json', Authorization: 'Bearer ' + this.token()},
      body: JSON.stringify({ answer })
    });
    return res.json();
  },
  async getSubmissions(id){
    const res = await fetch(this.base + '/assignments/' + id + '/submissions', {
      headers: { Authorization: 'Bearer ' + this.token()}
    });
    return res.json();
  },
  async mySubmissions(){
    const res = await fetch(this.base + '/my-submissions', {
      headers: { Authorization: 'Bearer ' + this.token()}
    });
    return res.json();
  },
  logout(){
    localStorage.removeItem('auth');
  }
};

export default API;
