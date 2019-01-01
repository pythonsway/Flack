document.addEventListener('DOMContentLoaded', () => {
    getUsername();
});

const init = username => {
    // connect to socket
    let socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    socket.on('connect', () => {
        socket.emit('userdata', { username });

        socket.on('logged', data => {
            showUsers(data);
        });

        setup(socket);

        socket.on('new channel', data => {
            showChannel(data.name, socket);
        });

        socket.on('channel exist', data => {
            channelExist(data);
        });

        socket.on('msg', data => {
            showMsg(data);
        });

        socket.on('channels', data => {
            clearChannels();
            for (let ch of data) {
                showChannel(ch, socket);
            }

            // initial active channel
            showActiveChannel(localStorage.getItem('channel'));
            changeMsgTitle(localStorage.getItem('channel'));
        });

        socket.on('msgs', data => {
            clearMsgs();
            data.forEach(msg => {
                showMsg(msg);
            });
        });
    });
};

const setup = socket => {
    let channelForm = document.querySelector('#channel-form');
    let channelNameInput = document.querySelector('#channel-name');
    let msgInput = document.querySelector('#msg-text');
    let msgForm = document.querySelector('#msg-form');
    let logout = document.querySelector('#logout');

    channelForm.addEventListener('submit', e => {
        // Prevent form submission
        e.preventDefault();

        let name = channelNameInput.value;

        if (!name) {
            return;
        }

        socket.emit('new channel', { name });

        channelNameInput.value = '';
    });

    msgForm.addEventListener('submit', e => {
        // Prevent form submission
        e.preventDefault();

        let msg = msgInput.value;
        let channel = localStorage.getItem('channel');

        if (!msg || !channel) {
            return;
        }

        socket.emit('new msg', {
            msg,
            channel,
            username: localStorage.getItem('username')
        });

        msgInput.value = '';
    });

    // Should be 'click', but Chrome prefers pointer events? 
    logout.addEventListener('pointerup', e => {
        e.preventDefault();

        let userName = localStorage.getItem('username');
        let useSection = document.querySelector('#usesection');

        useSection.classList.add('invisible');
        socket.emit('logout', { userName });
        localStorage.clear();
        getUsername();
    });

    socket.emit('get channels');

    if (localStorage.getItem('channel')) {
        socket.emit('get msgs', { name: localStorage.getItem('channel') });
    }
};

const showUsers = data => {
    let usersOnline = document.querySelector('#usersonline');
    let hello = document.querySelector('#hello');
    let useSection = document.querySelector('#usesection');
    let userName = localStorage.getItem('username');

    usersOnline.innerHTML = data.users;
    hello.innerHTML = `Hello ${userName} `;
    useSection.classList.remove('invisible');
};

const channelExist = data => {
    let chName = document.querySelector('#channel-name');
    let chFeedback = document.querySelector('#channel-feedback');
    let wrongName = data.name;

    chName.classList.add('is-invalid');
    chFeedback.innerHTML = `${wrongName} already exist, pick different name.`;
};

const showChannel = (name, socket) => {
    // grab ul that displays channels
    let ul = document.querySelector('#channel-list');
    let li = document.createElement('li');
    let chName = document.querySelector('#channel-name');

    // if earlier was provided wrong name
    chName.classList.remove('is-invalid');

    li.classList.add('list-group-item', 'list-group-item-action');
    li.innerHTML = name;

    li.addEventListener('click', () => {
        localStorage.setItem('channel', name);

        socket.emit('get msgs', { name });

        changeMsgTitle(name);

        // color active channel
        showActiveChannel(name);
    });

    ul.appendChild(li);
};

const changeMsgTitle = title_name => {
    // change title
    if (title_name) {
        let title = document.querySelector('#channel-label');
        title.innerHTML = '<span class="text-muted"># </span>' + title_name;
    }
};

const showActiveChannel = name => {
    document.querySelectorAll('#channel-list > li').forEach(e => {
        if (e.innerHTML == name) {
            e.classList.add('list-group-item-dark');
        } else {
            e.classList.remove('list-group-item-dark');
        }
    });
};

const clearChannels = () => {
    let ul = document.querySelector('#channel-list');
    ul.innerHTML = '';
};

const clearMsgs = () => {
    let ul = document.querySelector('#msg-list');
    ul.innerHTML = '';
};

const showMsg = data => {
    if (localStorage.getItem('channel') == data.channel) {
        let ul = document.querySelector('#msg-list');
        let li = document.createElement('li');

        li.classList.add('list-group-item');

        li.innerHTML = `<strong>${data.username}</strong>: <p>${
            data.msg
            }</p> <small class='text-muted d-flex justify-content-end'>${getDateString(
                data.created_at
            )}</small>`;
        ul.appendChild(li);

        // scroll msg-list
        ul.scrollTop = ul.scrollHeight - ul.clientHeight;
    }
};

const getUsername = () => {
    // get user name from browser Storage
    let userName = localStorage.getItem('username');

    if (!userName) {
        $('#modallogin').modal({ backdrop: 'static', keyboard: false });

        document.querySelector('#username-form').addEventListener('submit', e => {
            e.preventDefault();

            userName = document.querySelector('#username-text').value;

            if (typeof userName == 'string') {
                userName = userName.trim();
                localStorage.setItem('username', userName);
                $('.modal').modal('hide');
                init(userName);
            }
        });
    } else {
        init(userName);
    }
};

const getDateString = time => {
    // Python: (s) -> JS: (ms)
    time = new Date(time * 1000);

    return time.toLocaleString();
};
