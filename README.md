# webp maker

* .jpg, .png 파일을 .webp 로 변환 합니다.
* animated webp 파일을 생성 합니다.

## install

``` bash
$ npm install -D webp-maker
```

nodejs v12.x.x 이상 필요

## use

``` js
// webp.js

// from 폴더 속의 png 파일을 webp파일로 변환 합니다.
cwebp({
	from: './origin',
	to: './webp',
	quality: 90
}).then(() => {
//변환이 완료된 webp파일로 animated webp를 생성합니다.
	awebp({
		from: './webp',
		fps:10,
		to: './awebp/ani.webp'
	});
});
```

## Methods

### cwebp

.jpg, .png 파일을 .webp 로 변환 합니다.

| Name    | Type   | Default | description       |
|---------|--------|---------|-------------------|
| from    | String |         | 변환 폴더 경로 또는 파일 경로 |
| to      | String |         | 변환 완료 폴더  경로      | 
| quality | Number | 75      | 변환 품질             |

### awebp

animated webp 파일을 생성 합니다.

| Name   | Type   | Default | description          |
|--------|--------|---------|----------------------|
| from   | String |         | 변환 대상 .webp 파일 폴더 경로 |
| to     | String |         | 변환 완료 .webp 파일 경로    | 
| fps    | Number | 0       | 로컬 폴더 또는 파일 경로       |
| repeat | Number | 75      | 반복 횟수                |

#### awebp sample
![Alt text of the image](https://github.com/demoon84/webp-maker/blob/master/test/awebp/ani.webp)

