async function sendRequest(url){
    const response = await fetch(url);
    const data = await response.json();
    return data;
};

async function search(data){
    const request = await sendRequest(url);
    const curArr = [];
    let parentId;
    request.forEach(element => {
        if (element.Cur_Name === data.currencyName){
            parentId = element.Cur_ParentID;
        };
        if (element.Cur_ParentID === parentId){
            curArr.push(element)
        };
    });
    if(!data.dateTo){
        getDailyCur(curArr, data);
    }
    else if(new Date(data.dateFrom) - new Date(data.dateTo) < year){
        const changeDate = new Date(new Date(data.dateFrom) - year);
        data.dateTo = `${changeDate.getFullYear()}-${changeDate.getMonth() + 1}-${changeDate.getDate()}`;
        getRate(curArr, data);
    }
    else{
        getRate(curArr, data);
    }
    console.log(curArr);
};

async function getDailyCur(curArr, data){
    const curId = getCurId(curArr, data);
    const rateArr = [];
    const createUrl = `https://www.nbrb.by/api/exrates/rates/${curId}?ondate=${data.dateFrom}`; // попробовать написать универсальную функцию для создания ссылок
    const request = await sendRequest(createUrl);
    rateArr.push(request);
    console.log(rateArr);
}

function getCurId(curArr, data){
    for(let i = 0; i < curArr.length; i++){
        if (+ new Date(data.dateFrom) > + new Date(curArr[i].Cur_DateEnd)){

        }
        else {
            return curArr[i].Cur_ID;
        };
    };
};

function getCurScale(curArr){
    let CurScale;
    curArr.forEach(element =>{
        if(+ new Date (element.Cur_DateEnd) > + new Date()){
            CurScale = element.Cur_Scale;
        };
    });
    return CurScale;
};

async function getRate(curArr, data){
    const rateArr = {curScale: getCurScale(curArr), rate: []};
    
    let requestCounter = Math.floor(((new Date(data.dateFrom) - new Date(data.dateTo))) / year);
    let start = data.dateTo;
    let end =  `${new Date(start).getFullYear() + 1}-${new Date(start).getMonth() + 1}-${new Date(start).getDate()}`;
    let curId = getCurId(curArr, data);

    for(let i = 0; i < requestCounter; i++){
        for(let i = 0; i < curArr.length; i++){
            if(+ new Date(start) > + new Date(curArr[i].Cur_DateEnd)){

            }
            else if(+ new Date(start) >= + new Date(curArr[i].Cur_DateStart) && + new Date(end) <= + new Date(curArr[i].Cur_DateEnd)){
                    curId = curArr[i].Cur_ID;

                    const makeUrl = createUrl(curId, start, end);
                    const request = await sendRequest(makeUrl);

                    request.forEach(element => {
                        element.Cur_Scale = curArr[i].Cur_Scale;
                    })
                    rateArr.rate.push(request);

                    start = end;
                    end = `${new Date(start).getFullYear() + 1}-${new Date(start).getMonth() + 1}-${new Date(start).getDate()}`;

                    break;
            }
            else if(+ new Date(start) >= + new Date(curArr[i].Cur_DateStart) && + new Date(end) > + new Date(curArr[i].Cur_DateEnd)){
                curId = curArr[i].Cur_ID;                   
                end = curArr[i].Cur_DateEnd;

                const makeUrl = createUrl(curId, start, end);
                const request = await sendRequest(makeUrl);
                request.Cur_Scale = curArr[i].Cur_Scale;

                request.forEach(element => {
                    element.Cur_Scale = curArr[i].Cur_Scale;
                })
                rateArr.rate.push(request);

                requestCounter += 1;

                start = `${new Date(end).getFullYear() + 1}-${new Date(end).getMonth() + 1}-${new Date(end).getDate()}`;
                end = `${new Date(start).getFullYear() + 1}-${new Date(start).getMonth() + 1}-${new Date(start).getDate()}`;
                
                break;
            };
        };
    };
    console.log(rateArr)
    parseForChart(rateArr)
};

function createUrl(curId, start, end) {
    return `https://www.nbrb.by/api/exrates/rates/dynamics/${curId}?startDate=${start}&endDate=${end}`;
};