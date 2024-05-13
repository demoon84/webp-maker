# webp maker

* Transform PNG, JPG files to webp.
* Create animated webp.

## install

``` bash
$ npm install -D webp-maker
```

## use

``` js
// webp.js

// Transform PNG files from the folder into webp files.
cwebp({
	from: './origin',
	to: './webp',
	quality: 90
}).then(() => {
// Create an animated webp with the transformed webp file.
	awebp({
		from: './webp',
		fps:10,
		to: './awebp/ani.webp'
	});
});
```

## Methods

### cwebp
Transform PNG, JPG files to webp.

| Name    | Type   | Default | description       |
|---------|--------|---------|-------------------|
| from    | String |         | 변환 폴더 경로 또는 파일 경로 |
| to      | String |         | 변환 완료 폴더  경로      | 
| quality | Number | 75      | 변환 품질             |

### awebp
Create animated webp.

| Name   | Type   | Default | description          |
|--------|--------|---------|----------------------|
| from   | String |         | 변환 대상 .webp 파일 폴더 경로 |
| to     | String |         | 변환 완료 .webp 파일 경로    | 
| fps    | Number | 0       |                      |
| repeat | Number | 75      | 반복 횟수                |

#### awebp sample

![Alt text of the image](https://github.com/demoon84/webp-maker/blob/master/test/awebp/ani.webp)

