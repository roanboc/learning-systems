// The planet under the home page globe: land and sea, how far each place is
// from the coast, mid-ocean ridges and hot spots, a stylised map of the
// surface currents, and where life is densest today. Every globe style draws
// from it, so they all show the same Earth.
//
// Land: Natural Earth 1:50m land (public domain), as a 2048 x 1024 one-bit
// map, longitude -180..180 left to right and latitude 90..-90 top to bottom.
//
//   Planet.load().then((p) => ...)   decodes the map once, then:
//     p.isLand(lat, lon)
//     p.coastAt(lat, lon)    degrees from the coast: + inland, - out at sea
//     p.heatAt(lat, lon)     0..1 near ridges, hot spots and vents
//     p.lifeAt(lat, lon)     0..1 where life is densest today
//     p.current(lat, lon)    [east, north] surface current, about 1 at the strongest
//     p.texture()            RGBA bytes, 1024 x 512, for a WebGL globe:
//                            r coast (128 at the coast, 8 steps per cell), g inland
//                            depth (255 = 25 degrees), b heat, a life
//     p.fine()               the land map softened a little, one byte per cell at
//                            2048 x 1024, for sharp coastlines up close
(function (root) {
  'use strict';

  const LAND_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAACAAAAAQAAQAAAABdfITpAABSEUlEQVR42u29bYwl2Xke9pxbd7suyebUXXEhN8nm1KVFRESgYJsWYw6V0dQlxYT8kUQbwAgUwDGvpACmDQNuWUqylodTNeQaXAiEd37oB4EQ2pYs5APxDwlREjqgODXcDXcQbzidhHBWAcWt3h1zWzTNqZ4Z7VT31K03P+r7+1TVqerb2/f9MzN37q065znvx/O+5wtYy1rWspa1rGUta1nLWtaylrWsZS1rWcta1rKWtaxlLWtZy1rWspa1rGUta1nLWtaylq7yq0REZJ3b/ivki3seOy/TLboXAEDOO7mnOr1UoOY6peSdawVEN+kxEZFL2+nPzwUCska0DPvoJf5DlbMIvDOtQCkcZsmCSloGgHegI2Rkq+lO2gAUZ0ciR6Y7GQBWrfWj7o+4CMUyUp/cgEb2xi8vIT+a2SmsGAPm72jt97X8TSIizVGJ7Jup/zIUwjvLC1BR/xV6kYj0gv9zNMImVDKbv0kzV7H/Ur6PNqBShUgW9DbBYBfQVzCI5sLcIyo0i1g/1Fys5BL1eCX9vwUtH+hnVQDY/h9mY1fzqPQn8ukZB7k5J+BhXGUA1EIBmAngs9/AVch2fgwM5fTIlU6Ep8nT44ElMhhxiNHQ/an0yJPoK2TnfSI7PXIhE5EdUJ1bkQGoHP1vogDkkAuF6IpGdxKWcw0JAJzTA8DbuaiSTVYY80yZRwGauBn3mCxcli3oxXrDAup5WhzIcZJJL58ClOYDhg1nlgm0L5CNC5ehlo2z3tSiBAPgumrsAMiAzgFA2YCxR3QQdOdC3EHvMnTzN0t/pBPR/mlQIDfsq0r0emzbtRrgSWUWuylFIVKNx5TZn7QB+fhW8c8kTydyT8EJMDekAC8QPUjkwXVRwFWdkpxKdYqLJrL/A7uEi7p0OkawHbLA/yYaW90sZsdpuWMWOlTvqhawRI6XJzJK7RQrTWGPUs69NgyYxRHl2NOOLeJ06bqRKTsOTAZ9hxwq+5H/x25pfszhAiUiUsmWWvRFJiLCJ4bUARYyGX+0D5IK0DIGsDtEd4gutcl6dSKP0XcHBSDwOr5XCzRB4/CA5Sb+ywmGsNswUSQiaTgrmAL4JJGDa4EDupnomdaWBl/QoiRhxBr7dN1VW2TYbUsghj/0hm5DIaIf6zELap8HyWoUAlmbodSGSokUItN/nUFkgYh+Pia4KhcA00KrekAHD4jUtlVzfSgNUIlM39ObGtnQ6XUpdm4aVyJ0qfDBl8gkcmRvt7VXsi8O5AAB4ALIVsgG3H9LenAvjO8aVyZ8qcS2dCKbtcxsJXIMqAMQYv2FwNSuqo7k0y/J0EMfyJMKu4tpeX11D3o7RZaHosLq6+QCMqB/2cYr5AJQXS2K7hwq8JiM3RIA7pEBvf3c2QAYMBMKuYBsYguAQi6uhdN/NicNIrLMUmJtsPZpjT5AQiR5kMkGmB2MmQ09LAHZAFRTVt6s679T7sc8MKdtMJMGSIjiSOMma5Mxv5O46mFU+ngbQEMScDFBBIxLfVOgiMb7ayCURPrvRKS0NQAK1xAW6LnkBMbXPwVwFDNldRaYmkxxlC4AgIfNl0UJqW1RgH96nFlBInANYIC7AWBb+k7qpUezejtiStl/zeoBYAYrdnUeAPxMVUakdE2WZPLIugxIHiA7knbPloj8dUE3I/QZRzK8XWpjXIy3EDqt3ZRLQ7LpXpM9QCFAIvUmORIR0dEX36SvQ/E4qyHklANQr616cUmdJZxPbwDIRPZEJwIjAxK9+BY5+JgV+sWwisuI6OvVrtDb7OCECsspGkkPose/lvvvK3HZuVsM0K7bRGRDtzzJH8sL0CkTjlSnri7qjdsnooUKQHRXr5h0YWRpQtRC+j3VDOs/uENEDhSoZAPY1XA531YhE6MZP+8UJ4IVMWYqkacLmTsbQZeJyINCBEZE7vZFKPSYQc7n4nrTqjBfycMtdIsp+UGWKSkkrGp8UYkmd2BI5BKZKgWzIha4VaBlW3LVtJ3CF2WHYlsmohfI+lURShB6N08xoZL9WbK0klJvlR98xWz77vQndmHYzQKwpRLRHQI5lggAXFoSkataUMhREyskrYJafbFcf8FpF4QKDFniyLUUIiKPiTGDiwuZ6BGZDJDJ0shWSjSgghD9QHJausC891T1egOTiMidQhbjB6QkxIwcH4BlNC3EYQOvt44B9R6w2E2+hF0AWtei6VagiRGOG+yOze44PgCFiifQCSqFFIgrxkpiyKEWzHzZCV41BwD94H3GZwtttqwiVP6S7SofmP/QypXg7N4KoyoR3bEajViJBbTTgOJaYc4ETC0LwA4giygVKTmWJTtQy0Pa5dIg2Ko1rMACFDsfBYw3sw3aFASAnNVe6aYHjchNJhtcXNBuiX+RJV/LWhcZO0mX5Rc8mAj/z5I+Vrf8zDxYGu6AFLtfALQCAHTy12gmFYDI8WsjuJr8pgDHICUzDXIhEZG/Qk8nS6U7uQaWVANaAqAmGJ4DyHbhHES4SM8BZPrJlcTgifIBfi6/0F2/iE1EJiN6gehOzrmXzJG80K54nVgPLLnAxqRQxRArmZyIt6qIMonfn3seANAdG9DINonIkMMF8A5XGHDmLQ3QjHWxzMaiKQlrASnVIh2CACC6iMsgsvCsQseWnxw7GpGb42CqSBokJZT4gxZkE9jVCiJsxAcv6aI3qOlERC+Sp9maqZMJTyHP9NcEWDqRq2fTsGvNaRC4aJBGNnPAnPo5CC/hNTpL4MGISLX1YC2IpVs70MgmIm8zy0DcwjY9agtAQp3JwyXMdxsAoFUoA+e8AAOAfwEAtNg04U/QTM3pPuaYGID38XlmM8PPFD7npB38dmIQDQA/ZN+80UB7zchxdONBXw6A1ciETESWZgNEjkrkeFkvWDxArm6280B2sjyPizI5HPOQyYj8ltdJAwCAvhrmIJjh2ACAfcAAFgBjgMzjzf5BK/izqF08hvxn07qf7aeSWdapJqYQxeUfJQi0pmYAiV3TJk862FL/rGRFQnZ0hexaFbCBWejAl2VBgVMDjuaJ1doGABwDmC8AIJqt20r+YlLypDZOcOJPSgIAxoCzBdhQaqOcAjwD+DPuv5Oc00/JVW4qYimpuotOjGyAiF4MSU5q4/xSXBiUEw5GJbJ0f1XO6/VRwIGmfEutXJnBy82JTBadheEBUE2ZXECPdwukjEB29EYLRGp4kJuIx0ZQirtZ6wTTpcmiwCEjx+DKHLGZsGsXgOzTEzUJQHJ4pYJswNXaLYO7FvkOhYgsnRydyKldkmVKRORVLtLVcgDoPyypcCRLvW7Mz1JnRLyaxPbnCwCQEwCUGYOTDycX9FC5VPLj7ltETu32JFvKFgy1rAkSKMf5X3ArawIxlipl9wl7daVxKQbgPSUZmnqsvlpggE4MgOu/80H9orwXMgDoRGSYaQAKUhi3MiGIi68qkZEG4DjxPM3NJYQ3qX4l6LH2lnZzryAXi5vgBkr3IrURO5WPzgvrzNczq27DQBdPBXnYBhQiK12Wu5fQMC2LPxF5qEvRZLqpajfzX5ID5foZInKlkI+0Ebe+8pf7FrNyebHla8DDELMw9zmsLAh8CRefrY02ejFd8lfDSgkANOEAyMV5+4g5ARGJbcA1AI3IAyZKsjW/V1MTqy7NvPdVvZQv+rVdiSicj/Ja9b9yVb1aWL1knuT6u1gyAPm7WdmDwL1lekhvNi+IqK9+noiIdgpHJ2wCRymgVgM2obnlZZ+0rmjH9zzYipUF4NmQouuG9mBbynaQSNGb7hu/8gn/Wz8pWP3NaC8wLLcTAL4X1mytYDRyjTWBLYWI6LqrkpF0eP/YBDGiAwOATpbiPKunAWBU4ARrFIBVFs+jqOtqXQAgU/WAYL9zXSnbBPM0Vyc6cDSykl84MBi99OUwK7DYrTA+mFVRoMYHaIUAyDEh9nBBj3hAW3lEROQstLxCsoLMRYmdrRs5wZu0tA1Gjw3/CRrdBw4eZLi+YvMsX0hN46VeHUGl2vH4mP6CXeos4QYnuyaFh5pg+l6AkacSOSONXEbkXAQ0IlMygzMUnMrnVVrAbnG4iryV7k9ECQGADCV4i1E5m2Wr8WmIRO5F6ETkQCNH1cmTiBzdhEIEJXigVwlopQvcMF8vBEt7CLiAAi04ocIBfr0zAOHilrhMIHH9TCNy4YG+tv0+opdeJ0e3oBGZm1BeydIMpRkL0zLePdQl1YRiAbrp1/p1csGRCPFKnA1wAeCqRAbRJVwCVA8qubrt2yY2P5SxAE1uZgFaQfUsWN2hmepR4FMNIrpFniYOAKtuSUNKFA8Svf5NP5RCJ5ccBMztop72Knqz/kN9VPB1cgEoL1p6GFUf+Lu1VXEAeDVzWblRkUl3ADB6yIiInI8R2ZCh+lb1dllQvVlTe5L1FwoMRvU9r5udBRemAaMo0zngKc0cAPgkDNkGRphcA4DbnwMmeIzZu/4YACajVO00ltu3quvYl97YzVbCLD8TvZDbSmCIO5RwFC/0nnB8fQ+46MyDQ15cv4sbwBge5rhiAGBuCQDHNW3+2H+b+2gLAOayjT4lNk3GG0AC4z7w5wotPykEOQFFNQudav1UrVLEG9Wio5mgk8AoEJcyOe3q7TQStuoz3OT6jAIA7DYAmNAK9uS7EomTUWJCg7Nk/y4jZTObC7+yZDjB1MnjaAYjPb9ZJ4UuYl6QPDwcC7SAUaM2+vJMukZj+JMvZlh233y+xHvUyKzwI4vl54ongn3AcWAEvJr1qCzJC2zoG0VEmGfuKSEvhsmYzcpovDgf4IY7fz7UrcgQUR8j36H6lcppwO7E2WiRDxTrA6KQdb+tGjmp4jEW+Yp7PQCpqVX8nG83s3z+bJGg1c+xD5D8g2sk5+HDdg/Z3w8JQXZRSey4Upyn3gVIUwC4vsibu3p/G6KdoIELAHOddlv6DmazedQvuh2Gk1FhEFBMABsc27yPDOB4pOdDA7sglgg9CiOuTDZaWZHHPpwg/9FMbtKl3ozOxP2Eje03i+bIJT3LGxQyldop8O5O8KUQgNb5lfd+O/aBj8xowVziK3oUYcm7cK2wMibl/eoOo/4FtwKi2vZlN+nY3U1MXMarWuMh9WgexTpPKebFrCAVlAcAYPR0OAPd0oQm+NHon/l/PQwiQX58l2bscnZQuIvlA4GGsGlZYOhJbFchemChLb929C/bAZHWyS/aZQO7Eyeasn2tZKGMHA18TC20IUzACndjtKZXEpkJFTalHABefu6hFAArfJA9EAAjK0xrdtrq0HO4nCABO5G6R4bOtTw0Uvf3BBnFzrPphX49yWgO8q32dvuHSIkOXMBns+Tv+aSrKyPCizAjDYs/+18Z4ioGGgGY40agBTfaPCLt9pidG/A5R24YVJdghlnxCHAHcIJ+Y8nyA7HTxuhchcgF1HC+3skFNiu3zMYtpQHRiWye0JSnTF4yRgAwnwJYPjH6QptSo+sPl429jxQVQrJSUhrfjDKCebgqZW8AD7A0IhtuMDeQ4ayyn+07wZA7ubq4kVuEYZXOisSn87sYQAM8P2VZdgHxxgSAgwsT+D2Vq2zfL3Ufz8oUg4xRUa2qN2GZ17Rwu9eNXRzPx3g7cm3RgJfWGG8XNCSU7dqAIVQCwNlX2j8BBg6tEdyAC9dcpLRkBij3DfZG8Jf7rVaTdy+Kjp41AGD8bOPfHwG3sHdwgks2cGzgFXhmdZH1eXw7H0q3g+/eYDgVCfZWtvCBNoLbLq7tABLRG3o8BSoXT4lo5VMCLiQaVsxRkIMBgLvbDj4PAPb2gSXwgb0YgJLJoFsFlf7oz6Evo4tqUztoVxHwVfdqHMzeQ9kU3+FRwAwNGkycMArst4w7+/EMie/3/+e/lSLJkWvkEnPwq+jGFUUp/gkBxT9t34KskDPOshuTe1bQAwZWAHJHeTbaqJziz+odArJNH4XrYJzo8Lw+LIb2x583C5DrcT3r4ahmcrJGvhYmd86W8vX/GstjQ1qanPOB0Ua+6DR1Z5DDgRPU/+B4J5unNaTS84DH+XuZrdjwE3GwtBlWtnRkY5AUkOREqaoj4/bHjhI6NB3nuWJJ9FxEddVK5tR3MaCsLs0jJ7E6R9XujewjS9+/yOag1hBlwG2irxQuXJZaswAAWMjhE9UMAF5taUBJrIvrGwAXLNprk5nBa5MT72f8nZEO+zX7QwwMLw8xiqjonvis24C/qTg5xvUaMB0QABvjKC4bGQDieH1sNvKBiUDyfJmGrIrsAcuAdxyX8TGiV4he4V03mip1ZTM/iSsVSPqAvsMgMLZTt3MlNMCJmvoaji9zVcQTf7cKE8DawmaSiBQtkxI9DQAsbcnMvs1f26ImloS7nPeFZEmPvZlZGaJVLxBkFtJzaEQkcCFwce6SUtYRANAuAPULiQKd9FcWvIWAdPI/zTiG29XshqwkEWKGNQWcHqtChwH/uMkmd5MlsSnArE+G33oww8n7f7VhkPLiMNOoKpuym0/hI8D/0GWWrt4HAgaWvw3XyhSfCTCcKB5s3OC56sEtDDMpSz426r1I/Jinf/zn1tGi8TUT/C7A8FOhhx+NtHeUSAbN4JgY2zgemfgwaxKfzcghTtI/27OaBNKP2//ZFLjUa1lkjINdq6A0HacDRnhZwEt86yMBsIBJO2hx3ZGcptaLnpYGvRI4Pi1FUAssdmkYPgD0mQbhZdx2ZiVLnNQXe0oK/zkgmdUFGn8U7WjPA+PWgJDNuP4mF+7KxDzUgEchE+qrLv4igfmX2VGdBkzob4Tj2sAWp+HjZqwpAGQAPw49wriPwb/Fxr/K8B8jSNe/bJQA4I+djD8KP3iZv6Q6C6tb8wZZnr/14LEB/CBISIWcAJuTOZYA5ks2Ayag0rW2zH36Zorh19nA1VxBzWp096UcvsW/ttMC2Fu9TIIjLtWo5KhlJjD6/vf+zMBykvBtNys78KW8JTRR4a1HUZpOIU15qgcF8JIVsBmcJyuYmUFkX0nmeDpnMhBkEp7Gf27slhotqjXDm6KUxz1oQKpBes1pXkRW4ghS+QFvNpRY1sprxs+G+8JV8k0IgGJ+XjwARjrSVZooIzrwkv/UeQsCxdGxcl4gXEMtu9GloRvtF21ztTK4NLUKADe5UZHxP1prsD8oKCEkm6L5hxON+yiLpjWcXkElD3g4mSSzB+KtazaOX9Lv52jz99DHupjkMxUAl6qI0Aj7u0lHbpo1AbaomMNHBMbfwCx6lW0BYDa2e0gE71eVo7NRaxNzSlYLrWsv8alz83Y9TrybSbZPJ2c74gFIlmadjEaEGhDR1x3KLOKqPnEy3irdfF5r/H/HpYCL5ACeud/L+oDkMyfZQv0oYyZzL63A7tOVHbtSuIVtwdewd8fZo/UTF2A3TQHXAla6AOygei6EZe8DlO7w0cx5coUVpz3Ed3iyOxYjItbLAgk7EwSoSAPC8vQIU9xNscg6mwx2S05bDM1mZJ6jHRBAhD7qoXa2BsmKokAwaJeXYKlaPtl16b2v799tNBsQeeNI37eBvrYHWJVRf5SGybwLSlsw1VV5/UX9qSIypw8Y4KbkgrIjqpbisXwi8x/d4yoL3Uz6AN6hjDiaRIcS0V2gj3Jgrub1qJwIneT3jPxJnXX7B3//adILcKbEGwn7tP8ejrZ7UYBlroTzqlHulp3cBB2rPbjRAYCPpzg8n25v34mP2/gz0g30ogF2rgBtlOYCm9jKcTpidUFNNgC82mIy42gWr6f5tM9XekgF9qv/OwXAVM+zHo6tK4sUlwTAyeceRr7Cox8skXuKeB5Yd1TQNXlWVCDg8jNyWb28VJT3K5GHuuZ62EIfRfF0FFd8E2BmoQa891rBrb00/z5XqN3KWUUtQXkz9pvGly5joxcTuP9BM5MLpV+TBOD+7snzPNlk0aRAxlNwxYHRLMxMGfvUc3gDwC+KdwHbRUaxWwQAw+8WZfLf/Z943pM5i/ofcWQCYN+PHdR3fwGAZvWQDL6a884z4LCIq8klDInd5Ag12UoeR0wgMtQwSGnX59uQyOqBB1mFYXBaoAHuczNxjLUeAAaM7NAtz6+9ZGGz9HKDrjJNsuDrRjJDio2V/Xlx/6c2T3bbuBwiucA/jhfW0vYoYZgi5SfyX0w/eru0YBdrwFMl/VSsZ2pfMsllcjzGvFyehIHfxIwpfeVGm6kMf1lGhP5OSZtnXHvK3byjqRYPcOPtGnNm9rVW/Mmt9FurmGBxjOdyzem49wb/kSQGgNHVHhPjD80kroZfOulk3W5meJ8057UcPHw32/93eiwHSCZM9zP1AHy2jIY7XCVvs5kB+MoofROYAxt99h8Afv499d8pz/kk64naWPvYYpXht0g0/2RIE3hf33skHnsJ8uGV+IDyBk8f1xtA+8MuLva0KiYp32FFPfYrOeE/D0pNdmnXT3Uxo1UWIwH4sIGP9g3AXyuMgu4sAcDmxfKfc0TBjefbcEX3hL920EetLAlA1UGCt+t5LTud/S/cQoU08FIEgLlT9evv4Xs9tEmO5wFOSwduBwCMVKqsm73NQQXMNhpwQyki571w4bihbi5e7/wvdXULjrKY/f7sJy/XaQA5fiEZA5waGIc+LT2YtzZGUD7HQVlqs6EfZT+5XGuWt4M/N3rX9bulxFY7GeH/+rSAV4zfnfng+FfqfDDNcQuAh0nvAPwgwQMyfMcawa6vXdSXREY/lfng8dfqAPgSgA8BUvtj7BoEAaMsT78kaONklkkvn6p1nAaAN/mKR10l8YbXM/912NN5TS9z6bUEgFQMKSfN6wEApFljzKcW5zejTfQ9SnwhxeZhqwfIduOwo/GUkWSi/fkQ54bGN6CZ1ZWcsmRPaaxo812Or20dbTmDGgBG81Ym0HhnvQOd52szDNx/bKMVAM0CwngcXMpeK/98Z6iOz9oOZSBq/S3P8STRDABb2pzNGuT47Kg+NW2pAYf8S2FtfN7gfa6F3KRiTzItJML8ALi4zPsqC3u7wAj2r/B8WzYWOF3hA2DZJGO5ewEYY/sPeb57eYhCCsUrQ4y2TtD4EG/VwtxdMmACievJr+mDDnf7FTgK7/VutkyGakDhuVYFwAeHODjKY+5mV+hkzkNFyNTDS6m5jkZkAwEw6ugDcMx71OMvGam4WyPXBlF8D25QFe1QetCWfGCr4QZl8iwOvRrmzEDmdI0CwD7fF70FYAE0q5psiwtpA/k+EWvPrvCN1nGwOFnn2jw30BGydlVZm1cDGF/a8iN/pRszkF12X1hJHEYB7O5EiHtX2CbwnBld39S4PNOPWCI0wOb+mjb3Y8BRvc7QdBAATBGpL+eh0/7xAyazvH/4iMNoBqEBFJ9e2kED+FwAmQCBmTQb/Q7PTwbZNEOV4UZsQcQzoomk93CtmdgbAIAT0HgoACQAoyldB9hOd9fyXO4vbXOgoJfzDgA0OPR8hpEB/PaJ3bHZR18Pk/EvdkLACbNANu8ytvw+51l/u0C+At2MDHss3n7RiTFZYBW+poeZof/OmxjgPITILS9hvSGOMY++jSEB+II35XbuJVVamgB7JIjJW5UT/D0A8FvubJf7y8VQeQ4fleTlQWbooQfxAc4ljd//lW1FZF7EkuyOWVO4W3pjKA2Q/8cGx+kaJY57IxUqu2RNFPKtnx4oISO2bbYpPt5NTFvdwFZ0BdJyr5sbjBzAU3eH0YDHwEGb3/1c6l8LvGjGStIFABf4GQDY2B/IBA6tVneFLp2M615cjjqgHHZojwM8ZQD4rwaKAvRXZ61Ohc005A+ENWgfsBYA+8xAALyx3egcxpivuxl/eH0ajeBOlwaZ/mmNI7Nbv7gD0Wsa92FqqTCYPMvaAZiL+BYAtVsUhOSg82pEbgBAjZibHgOgJAGQ7BAcE9IrXWZFAEgu2OZAALiskQIg0dDU6brMDMGxutEgF4BEkMyBAFgwMlsAIJGXeIWVLMPZ3c7ctwHIZP7tzvSOV+EYocmpQnHqmz1fGfFZzVpnANyXB0qGTvzkbdaUrdEc5km2TrQUwVX9Z0lP7QwDwPOga+C8WuPKRjRhfxfApXz0NCJW1F72goLC7jAAGMCf8H73U8fWP4yqaBbG+X6aPJVDPnn3ouMDFO6Y09irOJ9wAZXc+JPUS90O98L7LWJKxWqFQS63LZQoYTj8P9x0SyIAHmb+bJEInQQa9LArAHx+3WvTSosmvqdzywpmXlsA/jK69unG6mlA2rB/BSzYyJeUud9CmrV9x3zPLwUddC6vifcByduFcJkRRVOFbvo7aJ8M+G5VpcHK4k3muyOrnAH4NAAjNH6Xp2rGJb7m0G8IqK8q3MS7Mbm2AHj+kd/Z66rkQEPU9pkggL9VdNVxUw3gXNfeAOkUw7uGPWyFfmEEZNY0zuatRi04H/jIuI2BTKBV1cE31EPIdgAzQ+qijhlw3I4LBqP2jcXxUACkzyPlL9nkfYiF5xOE4bVOgUbIYjS+dLiJE0zefIpL/g0oLDRd2fcEIRXcascFA2gvNKhFdpRXG9iqmxx1CwRsha3x68pGQL9GwGGnrTVvPzuUBjhNNkFKyeR/E9CIos8czY8OcVGriwZIInYm8RRE3GstIPUAgF0EGJGZ7qf8KApmrBMAXxsIAO7LRZIAOAAgeQDzr6ghlxwpe0PGmPWmAbw+gMuT7rcPHwDN/U1tX58642xGIP1ew+eNo1QC7S5Vb8UEnTZexQLgFxJl8iQiwi/9gZJ9btMg4KVuPFbcgaKA02KQwtKoXyMyANMc/+d2BWdskJZ7PJ0USYVbVa4S1IlevgJ8d5F7TPM1Yv4OEa46Sg/L5JpWET9rgDGfENw0cPzrz3TVLeBwnHRJUxGnFTPu7LuhVwGzjaAKdhUgMtkLBfckNc0CVboTFydUGsgHtMlYCBsIAXgJAGaFxQuj4UNxfCl2AfZwVLjJm8Iqo2tHua8BA9OiFdRS04LG4vZjQ2zzGXf5gVe0kAiaAPMAQDWhkpOvfqDp7KALFdCd2Nh4yxLVWlUnb7VDVp8DeDv0XpAKX9WozkAu7gHxAXfTgUzg3S0pIAD6e4GtumDT7GKuZVP34k3wd1M1JSFOsN6k6tlyESfVYzagzDHGg8JbXWaNWEBwxXaoNjMhS2VNjtfW9f8bBTHDSPVyA1PzAwK0cQ+MEzVumlmrhONauvEodQjBYaDfRpLAEgRcsjDOjOzcFQFALc/1alVgWak3U/rmBNA+9RvCAu40/ONwECdI3eou7J79LOB8yjD/VeeQ7fgjGzilmWGJAKA2sxhxMI/88eFOWslGxtvfz+6kGrWyAS/SbklIMlQ/Q+s90xFF2gNc4/EH3rvoXr0w8Pg/CP8h6EDQWiroms0eKGeqaP6MmOp++Gtangk2mxtzFA9gFNwcKJM1iA9gZhvHMY34UBC0LOXQ6pgMAzvMBBkMBoBLEzEmQJ2/UGVYF8zgZL/Z+MBsHaki5TITtOXSjhgAaqkgjxNM0qnlh+dhFFSt3Q0cGz7dODHm2VywnUYafpMls9Mqs1hUscmgXxKxAZCtE/1kyz+r6T32dCeX+hnSiw0rIkeAFCyL0KuvPuPXgFlXFcnJlNgUUKEYwIVDv4L19nz2n96YLae4n2AvV682DQz3WpcphhT7BIBkhYzQj5HWvnf0BTzEvY92qIckR8uoHhp+AGoNad60lc5tRCf8OXFYcCUXXje7pdC/jmozC34AbI6XNhPXRP56TgvG+Itj6n7gOPF1kB+AumjcPIlbminPsUg2vVtKeD/USQ9jiDIBt4Hd8Ylk+JehB7WSKER+oL6QxaetJvwjvufDOMHmTHAW74cahU5GCh6z1aUpkQPZVP4Qws7vF84DZCt+aJRrSYQZANXqsEKaguQlIC/eMGGwxUoulYpInmsBWOx193/gvgGZT3SBqyNCJliwyFZxATAyO66Rh0RuoGCXh9GAbssQYgAejQFQpyPXAwrg+rHE+d6qMsGkn4/rhf5Su6XR4cEjABi5zxsbAMx7fyQIgJox6XbWzaPMv5/qVJowALjL65jg/px9YC4IgOpbQ1ocCjWr4Jl2Jx6wC2B8G9ilL81n4lRWF7VQPBCt8o7SLpsFwzXHtOfVDUwDDVBvdCKKArKn5tGQRALwFw+7pAollhqK2KtmgiLaL32pvk7VAACHeF06n6T6fKkP/Xj1s3sn3xJYEBlVtKnFufWXuuWSdb1iJqY7pvN9kY9VhfrA3EqoZqlHHRWUTdDy6hQCNeCaLdIHZsZ80bm8kPnx8XwEBhsCV4g8J9QHZt685TdT6HUDV/1xsUUB4FX0cr9hISQ33SHfMwAROxxj+emX8Q2xgbVizbzRWPnVosXtcpRUdjt0GQAweVr0+lZJyJbRqBhQ4EcVQQD4tQnVaWyJ3bPZ9t5rhOSJQSIOOXMhGACP51W8pbFZkWXModgiBsSvKD4UDQAJDAKlTG9ToM0OZwK2uEYHLeq22/Fl7mFpCMBdcR01Sj5hBEgvd3z45aZ48za6rFJliYBkHlSdbGz+gpB7KGVbNAAmzzXUrUUzQi+ww95jCnggT6VekA8whTxlN6AAttn+3JRkED0xRQNgTdGnhLuclc5P8sMyz7FmA91yUZsMBjUiEvR0/jMtm2mALe6GxMLs4VOiUiGzLNJ0BMDJs8sT2BBW37wCoQBIc9EA5GVJ7MmejaWNWfxTv3HiiVCOn0knwHyvVwC8FqRwuycfgHFRPrTcbeMEuc39rtun1jQD4GSUfvIt4CfAj53my2OaEIsWxQb+nzQLg5S+QOx4DjKA19qsZeVHfo/6NLCGJjDPLt0xtgF4jadFpnXIz+rz5uEBGAH7qfTiELi+hzYzw4u6dLdjfu30AgAhOp0qzgHvNs/eZ4Bdm+25ia83p0fjvgBwlBk6K+cUmNX9djbulGo5ffmAk0lCNx+19KX2FuZ1ozpJ4bU6TtAYO0kW3E6s15hZFzhcp3u5hWsTz6gpXm53RzU6GtWWPjcq2CeH7AOcZ9s1TYdHCYrRlgGPf+2L1+uYyhN/2T0keIZ4i9G8xEqhhHtsRtYko3bex1skDt6XW62U5BvcptkgK3TJi2ZsamnUty2pXsc9DGVLACzEG3GpkLc15Pkc35LaGpvbAwB2cfxufLHQpF7TrA7D6vWmAQ5mdockrUnATerCYR9j344IFc84WjCarXOb8ihbbGAnDemQ0xsAZGwVHVFmA49Fq0DciS1Qq2LsvEidukaBG+Pi7Jw9auSp671m+tyLya2Grgq8NaemADwsSYFo0iQzarbTfAycfK5hsOpNA7xRwlEnYREdfBNn3zCA0Pxk2FEfPgB0vUgDvIY5Kw9Ho5TLZM2tn3oBYDBJeH33o61iqNcPAGbREJFhNCrbcCR4k3jMpc8AG32d6NhCA8zW7LaZsZlJXjNZzpuaQF8ARGfVZ1Rsu51+l7uJOBl4Dpji1opowLywEESY/lB00/YyxIEZ+PYtrrSL5pd61IBFkXd9Ge8xRI+MnVXq60zj0+0TvNynDwjdnZt6zNIQrQFJO2GNnu70aQLF8s/wEcEzOCyhAS5G4dP51ukxl9sRtgmDeZfPnmmWHc+avrVZ6XJ/NMZOD4EJAPCew3DTs5MJAg16xXNGqhFXAt0no+OwuBaRQ3YEnR1UpF3RzYhpAC40WdrIdTZ+fHqZp/79cBk94wPA7pGjXgsbkQZgo8FBQlzDaKf1xOXHzm2y5Ly5E7xVmmUYQi16P+1rGpwl1Ig1Nwdgv7glJ2wqWtfSZnyVm0Q6TepnLcJgOLGZibZ0SWz3Z8Ut5YjxN/rVAKcs9eGPO5yzfXaGGPDqt9FkMq1VNpgLMZqDU1x1W15J6UWkxI3IgchEZhMsVb4oIBfuzOOZGFTNHjVgmbfDLWAH8Hb7RT7gtp+s+963G5ljq1wga4eL5wCzwQweF2e8kH1NQLT+RbXCL/9yLnQLUwWRid/iyUQ28DFe3DW+KW6p8BafO5n73TI/W1oA5NZRoN2eNc8/z13hzQe5gCrLgDOMezwvYA/t5wafaZUe3F0u8BHhhcF5cZZvpBX8fuZb/7phVp4B4Of4RjwdzTcOzD/ACNzHv/LW+MeFtMBM+WDaL4Jp2RoAvvmXzB2mJ3OQwYyWd0w05fRWkkc59zMD/rhpGpyNAg0OMNgI8lOTADyPOfCbvXJhK1SEBADvmmaqaD80OgLAFUBMIzaEa5iBTBwbglOBUtfpJNpI6ZTp+EifmR0BuN+Qzfi+2gAgG7LYDk+Ls223vNjj4Le7v5ZrfiNeiyaHhxXoZPJu9+M8G8FmhWc0MJJSnylJ9tz5KBPgg02NKBiQPeCIlza0ymrCX9EXC6Ojnwc7TUoupblOvejRQkk5TFKUBosl+e6NytTEosfvpDUg9S+7uwYsuQ0/rQFHBv8U/l6bkXHjWlm5Lj3fOMXpMjHiwxDf3yCYCWYe+GqtQXmxPXRZwscRBljy3Bsv+szkZaEqtSgImMnyQ/Ig12S29FR3E+DJh6iAqYyw/NTe58RqgFuXQdlIEgEH0o96I6BFXsxO+r4RIPEerqxxagArPqop0gB/beLn48ODZBKgAaOmxpm0OkuoBtR1x3e7/31hltAeAH4eMInp2hwAGq1iaeBma5Q10eudZZOaUwkAPA7UKktctgX2flJrpIf8DWwAAM8M/GFEtxY+YHtNaBR/87gCq5P4dojNZwRmoYVqGfGw5FmS7CYRV5P5jg13094yF4XDlymxm9SaU+FRu+GZAwCzcCUZNbQpRG4jTzftoOA/zDR3nTcLZZ1EC5iHS/RaMKqAoxHZGsfaFIX3UEC18FZnKaMU8Ve04FvSQd9UOHiRJkVxYMeCbAL2/E1hsSBV/rR4ouR+8K3xxb41IEFSA1esutDoyIDu1LsuhfdURKXw7G2WniiIkkYn8sF5QjQWrAHHuWhlA7fYPQP4WovN3hwlIbPC/UedXHbity1VIFBT6ceBnnJkxZwaYCdyfTufi0VuQc+dbSx7ffuApN0FdYSnEGygNESpwCRByuwC27dKlWOC3iXOU243/zGnBjiJVNfKlSTj9EjLnewqU+8aECdnebR3BIE85mzCPJUbNcxoWpuAWaScAVE2an41bZ4NFUTBk5xNtDG91gC8XJcpiKCC8QkAlaE1rFHOhwSgong6Kh8Jo1m9+onwL7eMqiyZsmnMZAAAKlh/RQz6TrNs3Q00v7DSENEAw8sTh/59AN4IlfNdDbA5cVupWWGKHjuf8MrjSYviQnsAIs/zqIwalL6P01ZZZYZKs5zTiTZw53e1OD0QoTluAaAC6me1Dm0lXNisNrQ9K4PYdBAmuA9zDuCro9xumYoRbnT0zoSvUGQYOcvveCgtp1wNKZ3Z8Ic651koXwsLApkXqEREzycGUc1yQ3uQXOC50LJmfVPByiAAL/KHcwwsUtHWiXoAeE/DsQOa7xXlEkXJReh8NGsQDYgc0Zg/CryGFlcw3G9VQUjJZj8ABEbH/5Dx800ev+lDSVPemBbJU9wFkV62z5ffGDvZQ4N7xaRaZlkiVm31SBQAxf6/PAg9bMbUzeK8y62Lmz/BQD6g3WQof5CeFft2L8v2s+NLvc8LxKWXFpfsMOIOA3Lh01k2CkiZOrHkWANpgFtopHWlnGZUsAG80YtzW9gWfalA4VVzmzw/4qoK/pUClhE8oEgD3Ojfj2bDaEC7BXncyfrGjwGaNH/Ihbu3bwwEwLKbl+NIiHksIPude7+WTR+M3njADH3OxRqoPwzCRO6sMeX6k2kNYP0BUHT2+9amIBPAZ3A053rAV9O0Z+YYA5kAln89/9mhsIs4tvkWv0oZruC++5k5Z+DpToX/ZWl0FCAX6pfVMhNYGmaqNx7uDxUFel6MsRlo+406Bp6NRo8xnCQj9ZzzF7zi+qUFlkFZS/AAZgKMDDXJA9ibT3y+zzheqo2vzwSDO9qv5/YmMDZYajqKpG+/9mFjIBNIjPoIn5ry6EHzytUkl4NRhi+kINo15gOWx9Ro9YJs+XdxGbW/aHZEdNEDvCRZAmEjaQKX8N475lBOMD1ONg8ANvcTTwCA5b5/mCB/Ix+Ek+RLDzce8LJRAQDEG/l2rAbd4pLD+jZ6AMZmptC4NP7mcFEgvivYg871i/fyRwGgqMYrJTJQBkDy/MgQhqO55HzQHAwAKaxGax7zc5C6su+o0Q3KClUCAAC45s+2OCEmkqNag5lAvFSVXcAMmNRWPBpt0i86FcoraLiJ+JY9A8fmdLjoH5iATKSTjUn9Buyxzq0BBlTKawDLxIeRC/x78dSYBMn7/HA+gAWap0Tr+Wq3ET/ND4BCNQBsBABI8WcSZO+V4aJAqPC+zmnQqJaDWNwPX+xWvTIyCRcYJ0KjBUyNwQAILWoGAIpp4KDWAfOny6qBqomWRDXo2IgWkoyxvG4PpwEsXaiYz6eiWejtgoqIl81G2SxaM0Iz91vmbEATGAUMn0wAmjGp1b6T7m/NLxv6QjQSW8DoT4bTALjhmz3ftqXaua/mt7NVu5GRAVDsGT4AfPMXf3c4ALK3oY3rfVxXmmamzxf0DBOYeAkXQ7wnWogA4BALf7/cKFbB3sWrcDQ7wPjZiG0t+m+M7kA3GRGpVDhT1CUhTu+ajUtCt1Jq5hhInKNpAVdxCcOJaoNsqQkASmcAjuxEEGIEQAkhkUzgQ+PLAwKgnMjkSvkDUEUBUAC5Kzmp5MhI3FguA3j/2B3OBwBPbL3RLL9oNHFQlFu5hWQorp+9RaMhAYD1upTwfA9rmVDXPS12OqEbAcAy7Mt7AUi84yGsJGYkmJeyJ1QDin+fbvkccL2Edmx+bUgA7gMvmclObwnVAC/PvZMXUs4BD7MEqA76vqczJy946VMhah1QoxsEnTwAzIz3RU0BdjMZFKcAdKIhAWAZAGpfLjUBwC6GMEF70gAs/FVEQ/oAYrlsrX8xElnBol21QWAUMKysTxpM7GygNIHRzWD75ngYAKR5Lj+qlmXDHhZJ8p1O1um9bXL2VQwAHhnpVtY64SYqUqPSm1mMdgD8h7wGJEzker/VlgubxW7UTADAnLT6ydDqnOCGYCLk8mhtgiw2Sv7ry0uykRrcx5i/XvztiKIEk4k9XbZWe4KDwAtLPQCUsKngxpcf1jkUwQB4Wa4irihmVCuGC2CUZOITQC7tmYOehNWl8LmMvkM2HJYAEh4hHlnJBTag891I1Nt9g7VePnLtt1g70kDpAlk83zgGcALTPV0AZnVnSoUDRPO6MFesAXSS/k7ckQkDrKp9S0gyJGEAZJqpXrb5fEb9QaBeXUI5ynCFUZMw09uVm+YFPsAeCvJL8WrgKSzMsLT4wrYwAHJ+v+5qXb/BVJ+41xrzEwYwi73OwuehQ6YjBVGgng1qUa4vtciGUyTUArR4Dr3ZFp4eb52d8IQBEcdtuKoFK04/DHF7d5t5Qc41folsAJLHUR2pTe8lshOLFTc4dGYYDajNBo6wvMhBi2sB8DBJrNV7V7OrpnoEoOaazCVu8F4gWRuBk2WP3VPYRF5sAnXHCqjxT3+gNZoYy4ruQYlKp5HRzIfVgIL0p8YV/Zs4IPzVbqULs6nRDBMGqQHBURuvl0792oNMTjhPGv6ilQac1oVpdqfKgR24m5EBjKJfGMOaQIGpNkDzb3QggoCTGO1xA9MpAMA9JQ3oViA6wc4JAHjJPi/MU48CDdA86MCEAZAbLleFEr53NjAPYJ1+/Xoj95Bzb8aIQu49DbNLa2AAuj1o3ogI5pTbZNFDFty+h/VOhcU82+SCz4B/26xqcAMgePpYaRXBKzxIg4csVDJ11wD8bRNeAxogTtROALDqTTM1ckklS/XfpifeuzOoD1iI9osNAvN+7CuNxHuH1YGi0ZsL0ACu3P4OecGCieREgt2qI0ZLAHRqnA5yAWBy/vyAADAkTI/NhjQBZvSkWVwAkAGCkTnOdWS1GuuWhiO1Vl8AmLEuQQCARoeaAchOZAJSasK4gQa0ZNDdyLw16vZcC/jp/TkwkaM+jI1Bl0sXG7HTTYH4lWhXI0+OyYgFCwpkh8cERPmAC8VpKq+MWxQKEjIB8L/FJj9lW1DqF2MKBWCnfesroz1fSmNaYLNptDRp8m759kU4hzwA9EkDGoRBqX1FFAC2VKIfRXTUs1UiF8qgBQHqFAVKl85y+tYt1Xc4asCeNSKncNNxA+MTIXbnJ3ACcKik7emE3//0OjPEe/PYhU6ZQDiUsxjxT7DJFO7PDQBAJQHk3bSBtztDfR8Y2clhPwYmd4fQgHlF4sf+E04/Wz7OnIrMAHizjO05+IqFvoW9VuHF7/MzIbntzHCoiETu5ZAIOX5urho8brCjBow2xdScJp1ogK9GH0n8YxOAB/ePnb4BWP5Oda8WnM95pksuiOiA+bC/04fbwF/Ml782riwLCWBC7I1puQkc0wNeL641WSNZ/AAnsiQH9pMuoJrSi2RdrtA5EQBYvuspXPz9mB7xrojVOvEgYKESzcOUzGKudjesk1zo1wRoZlWRLIfXBkS4ayPsjQXMHybiYa9hsI5JbnVSM24NmNrADPDvujAh4YfACAQoxxhEikzAbWDFCt+GufJkVCGyLEx1IiJIRFcAGfj7ZMdcbTo0FZbgzXu4kb3YpTnxadIEgP53FTA2fxe2+u2FsMyk8Qh+i5vKKNQ9nXzTDudFJHImqgdclsiW7rmnlwx9ivubTsd0chSoeKhvh87feTdgeZgsg3XrV/oFYNrifziygT3ucAzgiedjz7yFZwHcJTiw/XD/C/0CYNemS4LcfRkjdYGwAMX84DQGgCcMBv+Mv+eNXpVdusm99bl4BLvxIOA6Ed3cgEpEHpRoSlV5yCI/JNdoUDdG2GWtb2lJrcE6O4uIPAUqEblQA+gMRp4UPUfaMYZ2gr6oPAlBV1puGIlbFexj/6TVRcDU/LFf/rjcB3RfLGF0jDR7Hd+/D+BNG3engOs7XvkWLtKcTeLW/ehrPQ5zw2Nw+IhAA+oy1YjsEaC8RS4UhwD5XxFB9U/2ccrrd4JMoHqPGEdG1HXfkG0Btgcsvz4fBT5t8+N7YZrl20CD9QqNRe626aWkoGA1a4EFYALVA3MIkGxbNlQ9OUUz608DqufhNjGYOMB3fZ/o7e+fRNzgcgM1awWJ2uaA7No42kQDpPDryibgaMEZjBfVZAs2+9OAWS1RrXOiXcskEcjHDwFYQSnQDuYGmAFAGnEB0IqVzjtH+aKvNEmlqdCdPlgm/fDB6RAhPulcNzCKlIfCj3+qiu4IWM+nU9cwoFbXhKccD4gtxrn4bCa8nACQfliiAdT7+LU7O40aVQbs5Ij+JNKH4ErcEVB8luswJrCxaNL+JgQqltR2cSf2BDfiaGydGgDs9/p/R8p5Jw62vR8q4XhqFpBhUSdJiWAwneLRBqUaEfi18Tg0pDEwm59eFGjnZ5ukiCeJMEDj478dOx8DAKTfuvPYNAuygZUJgwXScAfX/xr/9TOhV/65D0RMZQ9Lg3cjUXOpPROmlgoVZEMNJ3V2npmH4z0OqdmlC2HbPJmcHucGVgGAxF0k8YTdxYhhgGxgty8T2O8D1XHTOplalaQYsxvAq30B0P0clAKX37SAMUe+9G3Fan9gAG/0BcBJHxowagbACJg/Mcu4z+1ocOZA0SYKQQBQ/eg0f0LD2MkM7OC1TFbkpdm6Pe0rDBp9qECzhy5nUBz55vXUh7fDROTYAIC//PFphYH6bFdvu1I6Er8wOYuGdeovQZUTkywbm31pgDWgBlQe2/znVqT4Nt6d81WPzxITLJPDKuZ4NxcELyWpQdZbG6sDQOeSEJZTAFr4nGjP1Dw50k9LPQHQC8fca/j9oy8lqM8WsHBCQzqI0sOsXYkCoBkTGvF5kcapiz6Li2f/OtXTaaBhj7+46AeAZpkbZ6Y/b+MeFEN5boxLL/40M/amCM7e3LsfoOk0OmaqCQvpHAaVDgtlk+H43isfdDRDpzDxYZ5MZCAozErm9uJUADAGAgDszTvLJXm00O1EommAbEwBSPbmTso0VicKTMXQS/on0xEMdmvP2E8ZnOETQu/2wwbO+683eXFXDdA6M8FABVT6o6ed1LG7RIAWuemedtS2ORtYMBVOjaqccMu6B6hk+JOjL231wwSNbtliIRGadzCmrQQl3Dvxu+oAwL//HD8A0yF9gMBsQraARYJEHEwAG8w/a1n+u6eRDnLQBLXL1tsMAE6eash07EOsfKeBCZii4Gl3Rtms7evG+WLKSXjcm/OhfgCwBDLlrlZx/OnCIp2/auT4i/2YgNrtZNhCItQ6w9Ig2dmB1L1+r0FUOjLhooVmrQ/3uwjZzHPV4CO5gQkICwPtnEnDGB1HzTfGy1wIpWnQCLeX6lXNSkGOB0jdDiNLy+RCvrAgB+UFZiVZyzC5wBIDi/Nvp/55AwCOgzSQbog55Kt+AJutexeqAZlAagszszMmM9P3DJPTBqDl1KHXsXny/5MJBJucABiizbxlQO86OhNvCywRDuh7fQ55Rx5U7AM2upEz64rv75IayAwkFxCIw8PoA9Vu4eNNi1kyAJbc4UzzVG4yjA/g0YBxKQCtofXmuPgxI9vL+Sk4wfZZ5Vc7reTVTfbyorqT4gDY6+qxCj/9eON1EhlzHy7Oq92YcPmxtHJr7s6CPEyqWCYuDqCKUMcFwKzMt7Y/8H0jMD+vomGDaAgXpZ2Xftw5Jx1V+FFxAFSwvYcdHjvvcFH5pCrA1MQfofkwlxGXbrb6WadLk1wAMlVqgFu0gLK5dLyboTzYta9kbXGZB9BByVabRMwqfEsagFdOnwiKF7/+Ie0Vjq+ZBuC2ACLf0ZWUe2Oj3ZPHW5gDWFrpS1iqY05PJSGr7c9979jOu8guiIhcC5DzVWkjBn4GCNnd662YCcx8nXpoAFWHdg5SEOBxY3LZqgLWTgMYEfRgckWuqC6+Y2uCFKi5HVdBEjLt45V6Jx8gl/kAuaUPIFrqwbvlnBL2Mkum9gOA0q46zhLzi3KuCRcnPZiA3UM5oL22hm5vs6atoxW3Y2DWbR6nuINspwcAHvaDgol7bX4WKg6zCrXLFpwKAl0ruNMSaqH0Ypn3j/swgaZ8mtUVhFwAz7Q8edtOP3jamLhPmyuH2jAKsLof20jcodpQlMQqCyW32IQ9X6sBTvMEv+kt0sQxikrLOMCeiZKMwleHV1zKI6MUgMZyskK5wHQvtkxrWp67XhqVFhKk5lHLENyLvfYEY1aD/0fDGDMS6dRvCAbAqOFIFfK5+K9X57P8MzZCNySUCDli+08tfUuWCs3jDsdxMHjFt4W2mHW4KkYrDgJquxWzbJm89E4vXW1jiNUAwU7gBlqvlq2YDk7JVyfFwf6plltsTZH9X3aBM4nAouBcgbEf5P/at4s14H6eqHSR+eC5RUrj1YK+BJtqP2WOClu3bAmA1V4xLMHpdQ3pCvy1YY7GZikAzQsR9jD8QICEpG1rRE1T6cEyYkukZynRZuMLo2UHrl5tel2Vp0u/R5yp6nX/m7NyAERob0tYjA5pxOYpWRZrfXdywcxQlCV3SYZLydiih4KIWOlUYJpyfmMUATAX0mgSaCeCS4zzwsRNuKm0PyWfFZeRlHaL5rXyFfvjrqGuJydIQqsoeYWO0sHAI+3009f2TjA3s2Z00YD6tYrTATWg1dxe7LZbACCXV1eyvGMIAPjqJKYwTgWp6I0LUXT3tChGA0pW6NvfX9zxIQDgS+usagsadX3hRtpCvDOiAdMaMs+f+CS9oBE/dsT674TVQU9mzYkh8+qC8ckirvmPKsmbmIUUrdI6Ke1DG7TkS7XejrbsvgZbb39vplz4Kz2Y1mtw8olSv2nhqmQkcdnB6su4jdsoJwLLFACv9dt2Tg1wK4NfA2I8q6fHL8UojSB8QkdQxmCkvONdoS5n3+hjkVQf0qJ5ModmPFwc9gSA0YOlNEwLb/No2/TsUeHOPjA5QUxfHRKAk3baM29HI8qJ3aZR5CcGAOA25/dMPmfeNgjgPYm/v3wGTMBq97OKDs2L0BYLADt93Jqe1jmABpgdu2P02rqx0KcVwLn/sQFY5LBMo5k8ueJRs3cAZl0fIE4JdvoHwDsFHebv0ORUNGBo1RmfqgmMBDpZSzikG6egAQJOw/KENYa1BqD9aT4n7YfcFD8cRu92K3U5E1Itrgk2LNfIDY917NkE9gePflUTkR8eHoB5g+/aRcZjiizYTU+BB3RNoi2hTejdCbAuJyIqRb9Umq4Vrzrn/3HvCayUscBlExqgJG3gOKBt7NFEoPNgQ/uA9gerhJZPX2j4w480xEYsAOOSbjSXSBv2Gv7wpxra+WhFRlwYEf5+Qyq4QsmQUxexuORdp1pekbocDi4LOVb8vRVRwBvcB5yC/TR1O++4maHReQfAPbtOsCIx6JGNtwBgUf5fK3AoGzXMBVoAsNdT071TAaxfE2ivEa2JUGXGN19pHzBABd3sG4CpsFzgHWIC4pT3jAJgt1ZQU6SanxEfIOgKe+s0NWAmjMYb7wwTaEYZ3EEjQi8AzEW5NaGbkE9PA5ate/1QjCENzgOEMSH7jJqAyZ+a9sWEm760Vw1wRCF5TpigmNg37j0d7s0hi4HiVE1gLjxZO2MmYAhyZT3xIBrYB5w0/YElgAetlBM8DZVuCt5KaYDdnUA0FtajkTnvavhzOSQOR1PBlh78z2hYDfh/cQakTwC+1TqEd0oFjJUBoP0ZNXv9NKj/4JLeO71o7JCabbcuES2eDZfrT3PpUwNmbd2XIB70RjYODQ2Accqquge6UZud9ghA+3EUQwOODeC3zlY63L2OkJCDCYDl/BQBaK/I+yJSUiufj9mrrgGykBzCTOIwE5Kd8pt90xvXMwAIuXNdS4Y8lUgnIdF1CACkJoev1QAQ6IFCbvXS7R5NwGnrNUQepfiwzin1CEBzQk8CMoHQ+M2w0+4wUUASSOi7ZQKS0S+94OLybV2OTu1O0887kkjd6aDaKa0WETIEPeeYRf0y/mDA9sdrpR+1C2avk9t5raGUPkRYl7ovwG4BwIN2AKgCGsnS1ndFully3RHr0wSWs+YlUQCHx9PuXGSempb/Vg3/6wmAyWGrjObkUMC7rdS5W/P+PU6OyhKRx14xcEqSvmN2W1XLds5aPQJwmncqsHQALgfgqnATSDjwxekBQOm5juNsmpgmb0IBmGIF5XBWavMG3sHX7kZyIZNpZCj3uKfXWisDwG98ujJbE6oBs5VUgZvDOWS92W3bQ4lWUg+Rv9OjD7i0epqQA8B1ewRgvEI9L/NHdFF4BG56qcIwopY16Q3BGsBwxuTJHk3APQsAfNUQC8AGzqD0pQGrtF/MLvsPs0cA7BUCwCm1yvlmbwBYKwRA0PN8scXaeV9vAJgrZ+wHeaI+21SFArCqnn8JkFGYqEhmbxpgrBICMxSvV5kLfo+8mkQQGOvHhdNCOnl9acDDlQLAff6tuVOSIPXkA6ar5QVOrNv7A7itcGJouYL37EpmYfLmCE1bvRXOior2cMqiX8JIyBqfwUQh7zxUhWsoskgAVhjMnULXCHaeNCDPekj0qG1mneGqK8FU8MpBZSVpYAUAituPCbhnxSqcngAYr15XWcGpVpLwo8/U1TWBImp2YazYfWjAarpAh9nZj558ftoLADR7uHr9H21cyX/4Pli92OvhdPUA8Jh5lPtwYZm9AHB8RmLAjMxbYk3AXl1CXMx4/k/Bb5G11c0F9fwaVBJOhf/d+epGgaLIKBwAf9XRaGsVu2sW5K6e8HR4BgDsD1dzxPeLKbtIAIJQ++kzkwqIBuCbZYn3akS9XMZii05cPiMBAP1gFbtv5aZrJxAetf1nraYPyAVB7PqQiATAW2ETcHJUyBDf0GdXuB4kZ+kJE8/YRlhhALIXAEEOABgBl8W+ajUBWD6V+WALzAgAENVi75OrHPSzXnCRxEIUu265afxUTCKxi04YFfjkGQIgdAEiTWBVKWCh9JKxPR5og6oI0RIaIEzGJZxrFWXeR93iHxXt0F1NYRFfEV7BozPhCUa98JXHZykIhA0V7gNunwkAJtESaoEA+PNv5pkAYJrJ4YXImdwvIVKUgU5rEiFqFK0EaoBzhgbL7uPYzv40QPxsG9N64EFabycn9DDdKLvinz3vLSPqYbQe/xfin/nrgnMhqU8ncKkH7frTOQAowmyg14Ay7gEAS3BVoNdp5o/38VA6O9lgnw72/ALw3jPJX0UmQ8+e81xAO/UzpFYDgPNrAr4szy8AcwNYtS2Tp2ACZs9vYeaKm8C8b5xnK59p9izvM1YagP6DwObKasBAHHh1l+IOs1SavXjOAVhh+aC+skukhhH1DFYDhDrBE6C3S7LOhHzyDLmAXujaJ84QAGYfJrCPcy7SmYyCAjVgMybp893zqAGKGtaDmOedRw14V5SoErHzqAEbUUXwvY/PpQawzyE4RW7k3j+PAOCjIcNwvjY7jyYw0oiO/VzgDK2XEqgBHgCaxWnBaksfOqq+RC+a55gJsq+Qe/bSYZHymC4Ns1tgVVG+4B0PowGrSrRlOibnrKmtSB4wAU3PczYIB6Pdc71imtGjM7c8QKw8Ir14dvi8zBZIj9RiL6idE37EvlgyMyKfE34kle6asldnkHp9ukpEjnOGqIto0bWS5eLnpT6g3Lx391zHQXzo7ZfPNwBjB+dcJsY5zgUA4DHWspa1rGUta1nLWtaylrWsZS1rWUtKZmsI1rKWtaxlLWtZy1rWspZzIlfOOwDKWgfO7dAb5xyA8dZaCdaylvMr2nkH4OycpdLP4b1PnJFT9ntD9ZyvloRin+/+T85SY3s5Tk8CJPOcW8GH3fPdf/mBd55NAHj2iTfO8/iPJG9+rg1gQz/f2+gVmV4/M0GgBx8g0Vm5c68vBfi6Rt8+z1tntEN6fn6enaD24lnaK92DD3jJOsG5FqX3A9YLZbEyGjA9HQCmq6IAC/U0TpFQ2wIgviR2YzpnQ6rAxhIAnj5YlcDLzD5Ol9aNcgCCP33yLZ1+Gq6QK7ooLtVcZnsBgH+9DTv9U1w2NfEHjKs1j1SAX/VPs5RS1/zIRObV4XmQu/u8cAWoO7R8ofiHd8jxJSfPAirRgwKV6HfaVtKcHfQAQJENTABI3uKyTCb531Gii44WZJzKzUcbXyFHcETelsouclQuRdc7BbdcaeE9NzKRCT34OBuUjB4B+MW3hJ+nJrGyG7yk61QgRqA0NqKPXjIHA+DaI+GZkHJARHSzgFvs6kUAyPQVJ/vZcOmZK9zkLKWsD3JR9+kWkSefGgDSMQm+a4u5UtgLKx8deSVjlmaPANyxxT5RdpSSgZSoAQCXUw/tsVzz0ouW2AcS3Ut1JTqUqkn/6a3hrkHUxGpAXs3D5+vUSKzBABDqBJVSc9aa9b/0uFvhBRFL6I2Lu/mPxkHS2fBJk6GKJpqrmD0aQJgWSdRcbFweoiQ2eu9cwMmqihXn+Bmm0T5E2VLfAGjAnL0pYo3YTpDm5sX3AW0u3dtUTKtfACTThAkScYbqfC9EoVhaWrPaLwCBf/onAh5VXsiYAABrG9WE5+qZxN3WieieCPfnlYU6uyQ88orRowb8l/7wbIpgXayMsd4AOs0+93dB+CZ+kVyNiNoeqXctHQC/g8IRNAGw9gqQTQwFasBvGsEC0WVLD/Xb6X9+8qVi7wDoqzn7SmDkqUTU6Ix52Yg6FvgnKRzit0pMWKJOYvZnAnidlEZVSAmQwUzgIuBcvohnsQWoRlWmj84A9JkW3aKvNLh3dNvfWXVgQSVIRGQ6uMJMxUDlALJXugHg9LWXccOBSi8REb1icKqMAkAyZSKyZT/TuyZZNUHORLf+k6tTL1ehMHKh0kFZBbfA+lV/WTlLprpEdk2Q7w6Axt3EZrUrMqHRERHRIx59gUpgdkHGZ9YRmY4A0Ov9OALZBJEPAA8RkC3FxXut5iG9EwnIV0nF8YDj+TjUK46ayPZkCxL9NhZNPdKxmCbLfQRDIiK7qvyUTJxfdBUiIqt5EJNIiAqYwpmgn2oa4NoyYi0kuzg/rfthkHN2VoFZRwA2ZCNXsLsL7jmHw9Z5Mi6JGa+O9UGN6M8y0y2Ka6hkqURUP0ajplXt2AdukhixOgNAr2eC6S4jH4D6XEUy2rZbkgQB0D3s59lEOEPPkay1jWXehi4IgM5USCFvI1OaIvKgcwCwg9YW4MqC+q91A8APo1fAbDmFSUDT6gBgX27NY1VBAHSsXAeTHxZsPXL7uoFwzn7WkwEQOdpKALAjB3SHPfBtSbbB6NWADNV62A5k1hYDwKOIC/PxACljMBMXgHLk6u4+dNkAtjcB/BgKn2/d6Kx6nV04a7a/V3WKaG8iouoeQH8UerbnOGLoKYvZjE+qWb/O7KQft6ARWcpXuOxrtgIA3HFxoWHIm2r0klVqxWaQZfMAsNtocU9PADSOgZqr0ZHNrC0uN1YFALNWAIAfNp4XuC3dxr+cXrB+NtACqvQhVQBcBHAwP+UK/v/XCIAFmHGMCT6Jozksf+K++nbxKi9/cAOSddoAzJp8+YIH5oTTVWQpTr0N1PgA5dRjgMOvAZJx/wr8HzAL8ZoNqvhhdTp8o2rafxi52GBu8KpOL0FXolnFedj6ijDy+zXPPG0DWCY9WN0VnHlqd90PIXL5onDlfjURPu2pzeMJrwbIRXmd7gBE7nF5Sekf1FWDVkkqW3OpHBZJLS/91rCM8Wn3ObWjp9QEFr/vTVpufag2K9U6bQDevMgzHNsX0LL/1ytJtX36Wr/NZQJS25YuqyxAX4H+863i+41eio06rYLwFIN0t2VbK0eYaPUAKHZYctudX8sqF68bWAlJNbLYBxyPW7K1lxvU1VaYB8hv/puj5s6fTatnBrdXsf/FYdC9QPf2Fg2fNMdRJQGQrFXps1ulARckD8AF+2iv6WNrcjxpdc7Xk40KAJ50mYvL8otW4/GqOUf+6gqp/TyREBeYgEQH/3Rbaa6wxM6KB5yB0cGswgdc/GKryWO6VR47NrFSMis1gZlf72r32HwMiGYO7VXq/jYsNivL1doSQKloVlwPlyZLtFKSSNmZCGftTHA0RWRWqdqPX35ZrZOGl9MHkbVmTWDJWPMHbgCKA1+r7PTnQYl8ulIeQHrwG/NSJtjG/v9yDgQLJVLL3rYKnM5qyFcLnSCzWlbsNm6F1VPZupHxqF4QeVdHyMD1TxczJALaTd2awcIAKZ1q6tFyGW2VXOCLZRmLRjbKDqbg24ikpvejxAUSeZUAMMtygTkUAMctjIAFUcWiz5p53gnAWaEzRtN0bZTmMXYdpS2RXwrqLCeXcsUW3//JjE2xisLSYdsvlrQrCDGAjp62Ek8kADjyO85u/rK9el1OawCNguMFj1kb5wpgfuPAsKKdvenN6tf+mM2w6iJ7gGag1d7cwP+rdrSmSk0tmVMJELPbQ+ga2bTHOx4Bt+x25fsAgLs3gMUYAF7wux5WVg4YQGflwN0Oy68vANC8xGAbnR4qXiyOmiBrhZo5B4BjAnAUJQFxgqSvyOCq5ryqJuiPVSvmOgOuAMfhby8BoNDvMRruJCP+YkgpALjV5sFTS70F4NaHfQgsYBk9/cLKWnuRCbRcwqEoFuhgBusANwKnF9YYRvbZAaBj+XorTyWZixV2/kkTUG10nr+R8/itmvrvlfsAxe2+ilPKzRDvrBgAz5YCcMDGAG51dtfpEvig52xzKalZFQWs7i84GGcLhisml6sA+Judz1y9NYsLLETCNnqKrIkaFQC8LOKyOMkvApkrVw4MZFHNAzpekKERlmOEC6xNWr3+H/2sNaui/Z2XstIIq7MeplASi2QKqPC1ro8/QWYOfvW8gJsGILgazJ+/6t70jcgAVheBtAkwD0dTQHKZmKXcR9OVv3U02u8wgk/eFSJ3yQQ93S46DHW1xMtEAUaARAc/86dCyhYqrXr/IVHgCKNBX/02i5Zb8xQA5/Gu4KNpIgweMXbuAFCMFBFi3vnTAdyK14ud0wuz/QUhNDrnAATe8DwaQeQEiYh0dgbmL/vSgDAw0PkG4BybwBqANQBrANYArAFYA7AGYA3AGoA1AGsA1gCsAVgDsAZgDcAagDUAawDWAKwBWAOwBmANwBqANQDvbPn/ARGO+n0Z5tjCAAAAAElFTkSuQmCC';
  const MW = 2048, MH = 1024;   // the land map
  const W = 1024, H = 512;      // derived fields
  const CELL = 360 / W;         // degrees per field cell

  // Mid-ocean ridges, as lines of [lat, lon]. Approximate, for drawing.
  const RIDGES = [
    // Gakkel Ridge, under the Arctic ice
    [[84, -5], [85.5, 40], [86, 80], [84, 110], [81.5, 125]],
    // Mid-Atlantic Ridge, from Svalbard through Iceland to the far south
    [[79, 4], [76, 8], [73, 8], [71, -2], [69, -8], [67, -17], [64.5, -18.5], [63.5, -23], [61, -27], [58, -31], [55, -35],
      [52, -31], [48, -28], [45, -28], [40, -29.5], [37, -32.5], [33, -37], [30, -42], [26, -45], [22, -45], [18, -46],
      [14, -45], [10, -41], [7, -36], [4, -32], [1, -28], [0, -20], [-2, -14], [-6, -12], [-10, -13.5], [-14, -14],
      [-18, -13], [-22, -13], [-26, -13.5], [-30, -13.5], [-34, -15], [-38, -16.5], [-42, -16.5], [-46, -14],
      [-50, -8], [-54, -1]],
    // Southwest Indian Ridge
    [[-54, -1], [-53, 9], [-50, 18], [-46, 30], [-42, 40], [-38, 50], [-33, 57], [-28, 63], [-25.5, 70]],
    // Central Indian Ridge, the Gulf of Aden and the Red Sea
    [[-25.5, 70], [-20, 66.5], [-14, 66], [-8, 68], [-2, 68], [3, 63], [8, 59], [12, 54], [13, 48], [12, 44],
      [15, 42], [20, 38], [25, 36], [28, 34]],
    // Southeast Indian Ridge
    [[-25.5, 70], [-30, 76], [-37, 79], [-42, 86], [-46, 96], [-49, 108], [-50, 120], [-50, 130], [-52, 140],
      [-56, 148], [-60, 155], [-62, 160]],
    // Pacific-Antarctic Ridge and the East Pacific Rise, up to the Gulf of California
    [[-62, 160], [-63, 175], [-64, -170], [-62, -155], [-58, -145], [-55, -130], [-52, -118], [-45, -112],
      [-36, -110], [-28, -112.5], [-20, -113.5], [-12, -110.5], [-5, -106], [2, -102.5], [9, -104], [13, -104],
      [17, -106], [21, -108.5], [23, -108], [26, -110], [29, -113], [31.5, -114.5]],
    // Galapagos Rift and Chile Rise
    [[2, -102.5], [1.5, -95], [2, -86]],
    [[-36, -110], [-38, -98], [-42, -85], [-46, -76]],
    // Juan de Fuca Ridge
    [[40.5, -127], [44, -130], [48, -129], [50, -130]],
  ];

  // Hot spots: plumes of hot rock under Hawaii, Iceland and others.
  const HOTSPOTS = [
    ['Hawaii', 19.4, -155.3], ['Iceland', 64.6, -17.5], ['Yellowstone', 44.4, -110.6], ['Afar', 11.5, 41.5],
    ['Galápagos', -0.4, -91.3], ['Réunion', -21.1, 55.5], ['Azores', 38.7, -28], ['Canaries', 28.3, -16.6],
    ['Samoa', -14.2, -169.1], ['Tristan da Cunha', -37.1, -12.3], ['Kerguelen', -49.3, 69.6],
  ];

  // Hydrothermal vents where the story of life's chemistry is often told.
  const VENTS = [
    ['Lost City', 30.12, -42.12], ['Black smokers, East Pacific Rise', 20.85, -109.1],
  ];

  // The big ocean gyres: [lat, lon, radius in degrees, turn]. turn > 0 is
  // clockwise seen from above (northern gyres), < 0 anticlockwise (southern).
  const GYRES = [
    [31, -48, 22, 1], [57, -36, 11, -0.7], [-27, -18, 20, -1],
    [31, -172, 36, 1], [51, -160, 13, -0.6], [-30, -118, 34, -1],
    [-27, 80, 24, -1], [12, 65, 9, 0.5],
  ];

  // ---------- Distance fields ----------

  // Squared distance from every cell to the nearest cell where sites is 1:
  // Felzenszwalb and Huttenlocher's exact transform, one axis at a time.
  function edt(sites, w, h) {
    const INF = 1e20, n = Math.max(w, h);
    const f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
    const out = new Float64Array(w * h);
    function pass(len) {
      let k = 0;
      v[0] = 0; z[0] = -INF; z[1] = INF;
      for (let q = 1; q < len; q++) {
        let s;
        for (;;) {
          const r = v[k];
          s = ((f[q] + q * q) - (f[r] + r * r)) / (2 * q - 2 * r);
          if (s > z[k] || k === 0) break;
          k--;
        }
        if (s <= z[k]) { v[k] = q; z[k] = -INF; z[k + 1] = INF; continue; }
        k++; v[k] = q; z[k] = s; z[k + 1] = INF;
      }
      k = 0;
      for (let q = 0; q < len; q++) {
        while (z[k + 1] < q) k++;
        const r = v[k];
        d[q] = (q - r) * (q - r) + f[r];
      }
    }
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) f[y] = sites[y * w + x] ? 0 : INF;
      pass(h);
      for (let y = 0; y < h; y++) out[y * w + x] = d[y];
    }
    for (let y = 0; y < h; y++) {
      const o = y * w;
      for (let x = 0; x < w; x++) f[x] = out[o + x];
      pass(w);
      for (let x = 0; x < w; x++) out[o + x] = d[x];
    }
    return out;
  }

  // Degrees from the coast, + on land and - at sea. The map wraps east-west.
  function signedDistance(land) {
    const P = 96, PW = W + 2 * P, n = PW * H;
    const a = new Uint8Array(n), b = new Uint8Array(n);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < PW; x++) {
        const m = land[y * W + (x - P + W) % W];
        a[y * PW + x] = m; b[y * PW + x] = 1 - m;
      }
    }
    const toLand = edt(a, PW, H), toSea = edt(b, PW, H);
    const out = new Float32Array(W * H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * PW + x + P, o = y * W + x;
        // The coastline runs between cells, half a cell from each side.
        out[o] = (land[o] ? Math.sqrt(toSea[i]) - 0.5 : 0.5 - Math.sqrt(toLand[i])) * CELL;
      }
    }
    return out;
  }

  // ---------- Heat, life and currents ----------

  // Keep a line's longitudes continuous across the antimeridian.
  function unwrap(line) {
    let prev = null;
    return line.map(([lat, lon]) => {
      if (prev !== null) { while (lon - prev > 180) lon -= 360; while (lon - prev < -180) lon += 360; }
      prev = lon;
      return [lat, lon];
    });
  }

  function heatField() {
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    const px = (lon) => (lon + 180) / 360 * W, py = (lat) => (90 - lat) / 180 * H;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const lines = RIDGES.map(unwrap);
    for (const [width, alpha] of [[16, 0.1], [9, 0.2], [4, 0.45], [1.6, 0.9]]) {
      ctx.strokeStyle = 'rgba(255,255,255,' + alpha + ')';
      ctx.lineWidth = width;
      for (const off of [-W, 0, W]) {
        for (const line of lines) {
          ctx.beginPath();
          line.forEach(([lat, lon], i) => { const x = px(lon) + off, y = py(lat); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
          ctx.stroke();
        }
      }
    }
    for (const [, lat, lon] of HOTSPOTS.concat(VENTS)) {
      const x = px(lon), y = py(lat), r = 9;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    const d = ctx.getImageData(0, 0, W, H).data, out = new Float32Array(W * H);
    for (let i = 0; i < out.length; i++) out[i] = d[i * 4 + 3] / 255;
    return out;
  }

  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  // Where life is densest today, from latitude and distance to the coast:
  // wet tropics and temperate forests on land, deserts in the dry subtropics
  // and deep inside continents; at sea, coasts and cold, mixed high latitudes.
  function lifeField(coast) {
    const out = new Float32Array(W * H);
    for (let y = 0; y < H; y++) {
      const lat = 90 - (y + 0.5) * CELL, a = Math.abs(lat);
      const tropic = Math.exp(-((a / 11) ** 2));
      const desert = smooth(14, 22, a) * (1 - smooth(32, 40, a));
      const temperate = smooth(36, 46, a) * (1 - smooth(60, 68, a));
      const cold = smooth(62, 72, a);
      const sea = 0.12 + 0.55 * smooth(38, 52, a) * (1 - smooth(68, 78, a)) + 0.35 * Math.exp(-((a / 3) ** 2));
      for (let x = 0; x < W; x++) {
        const o = y * W + x, c = coast[o];
        if (c > 0) {
          const dry = smooth(4, 16, c) * (1 - tropic);
          let v = 0.25 + 0.75 * tropic + 0.55 * temperate - 0.7 * desert - 0.35 * dry;
          v *= 1 - 0.85 * cold;
          if (lat < -60) v = 0;
          out[o] = Math.max(0, Math.min(1, v));
        } else {
          const near = Math.exp(c / 2.2);
          out[o] = Math.max(0, Math.min(1, sea * (1 - cold * 0.4) + 0.6 * near));
        }
      }
    }
    return out;
  }

  // A stylised map of the surface currents on a coarse grid: the gyres, the
  // Antarctic Circumpolar Current, and flow that turns to run along coasts.
  const FW = 256, FH = 128, FCELL = 360 / FW;
  function currentField(coastAt) {
    const flow = new Float32Array(FW * FH * 2);
    const e = 0.5;
    for (let y = 0; y < FH; y++) {
      const lat = 90 - (y + 0.5) * FCELL;
      for (let x = 0; x < FW; x++) {
        const lon = -180 + (x + 0.5) * FCELL;
        const c = coastAt(lat, lon);
        let u = 0, v = 0;
        if (c < 0) {
          for (const [glat, glon, R, turn] of GYRES) {
            let dx = lon - glon;
            dx = ((dx + 540) % 360) - 180;
            dx *= Math.cos(glat * Math.PI / 180);
            const dy = lat - glat, r = Math.hypot(dx, dy) || 1e-6, q = r / R;
            const s = turn * 2.33 * q * Math.exp(-q * q);
            u += s * dy / r; v -= s * dx / r;
          }
          // Antarctic Circumpolar Current, and a weak westward drift on the equator.
          u += 1.1 * Math.exp(-(((lat + 56) / 7) ** 2));
          u -= 0.35 * Math.exp(-((lat / 4) ** 2));
          // Near a coast, keep only the part of the flow that runs along it.
          if (c > -4) {
            const gx = (coastAt(lat, lon + e) - coastAt(lat, lon - e)) / (2 * e * Math.max(0.2, Math.cos(lat * Math.PI / 180)));
            const gy = (coastAt(lat + e, lon) - coastAt(lat - e, lon)) / (2 * e);
            const g = Math.hypot(gx, gy);
            if (g > 1e-6) {
              const nx = gx / g, ny = gy / g, into = u * nx + v * ny;
              const w = smooth(-4, -0.6, c);
              if (into > 0) { u -= into * nx * w; v -= into * ny * w; }
            }
          }
          u *= smooth(0, -0.8, c); v *= smooth(0, -0.8, c);
        }
        flow[(y * FW + x) * 2] = u;
        flow[(y * FW + x) * 2 + 1] = v;
      }
    }
    return flow;
  }

  // ---------- The planet ----------

  function bilinear(field, w, h, lat, lon, stride, k) {
    const x = (lon + 180) / 360 * w - 0.5, y = (90 - lat) / 180 * h - 0.5;
    const x0 = Math.floor(x), y0 = Math.max(0, Math.min(h - 2, Math.floor(y)));
    const fx = x - x0, fy = Math.max(0, Math.min(1, y - y0));
    const xa = ((x0 % w) + w) % w, xb = (xa + 1) % w;
    const s = stride || 1, o = k || 0;
    const g = (xx, yy) => field[(yy * w + xx) * s + o];
    return (g(xa, y0) * (1 - fx) + g(xb, y0) * fx) * (1 - fy) + (g(xa, y0 + 1) * (1 - fx) + g(xb, y0 + 1) * fx) * fy;
  }

  class Planet {
    constructor(mask) {
      this.mask = mask;
      // Half-resolution land for the fields: land where most of a 2 x 2 block is land.
      const land = new Uint8Array(W * H);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = y * 2 * MW + x * 2;
          land[y * W + x] = mask[i] + mask[i + 1] + mask[i + MW] + mask[i + MW + 1] >= 2 ? 1 : 0;
        }
      }
      this.coast = signedDistance(land);
      this.heat = heatField();
      this.life = lifeField(this.coast);
      this.flow = currentField((lat, lon) => this.coastAt(lat, lon));
    }
    isLand(lat, lon) {
      const x = Math.floor((((lon + 180) / 360 * MW) % MW + MW) % MW);
      const y = Math.max(0, Math.min(MH - 1, Math.floor((90 - lat) / 180 * MH)));
      return this.mask[y * MW + x] === 1;
    }
    coastAt(lat, lon) { return bilinear(this.coast, W, H, lat, lon); }
    heatAt(lat, lon) { return bilinear(this.heat, W, H, lat, lon); }
    lifeAt(lat, lon) { return bilinear(this.life, W, H, lat, lon); }
    current(lat, lon, out) {
      const o = out || [0, 0];
      o[0] = bilinear(this.flow, FW, FH, lat, lon, 2, 0);
      o[1] = bilinear(this.flow, FW, FH, lat, lon, 2, 1);
      return o;
    }
    texture() {
      if (this._tex) return this._tex;
      const t = new Uint8Array(W * H * 4);
      for (let i = 0; i < W * H; i++) {
        const c = this.coast[i];
        t[i * 4] = Math.max(0, Math.min(255, Math.round(128 + c / CELL * 8)));
        t[i * 4 + 1] = Math.max(0, Math.min(255, Math.round(c / 25 * 255)));
        t[i * 4 + 2] = Math.round(this.heat[i] * 255);
        t[i * 4 + 3] = Math.round(this.life[i] * 255);
      }
      this._tex = { data: t, width: W, height: H };
      return this._tex;
    }
    fine() {
      if (this._fine) return this._fine;
      // Two passes of a 5-cell box blur each way, wrapping east-west.
      let a = new Float32Array(MW * MH), b = new Float32Array(MW * MH);
      for (let i = 0; i < a.length; i++) a[i] = this.mask[i];
      const R = 2, n = 2 * R + 1;
      for (let pass = 0; pass < 2; pass++) {
        for (let y = 0; y < MH; y++) {
          const o = y * MW;
          let s = 0;
          for (let k = -R; k <= R; k++) s += a[o + ((k + MW) % MW)];
          for (let x = 0; x < MW; x++) {
            b[o + x] = s / n;
            s += a[o + (x + R + 1) % MW] - a[o + (x - R + MW) % MW];
          }
        }
        for (let x = 0; x < MW; x++) {
          let s = 0;
          for (let k = -R; k <= R; k++) s += b[Math.max(0, Math.min(MH - 1, k)) * MW + x];
          for (let y = 0; y < MH; y++) {
            a[y * MW + x] = s / n;
            s += b[Math.min(MH - 1, y + R + 1) * MW + x] - b[Math.max(0, y - R) * MW + x];
          }
        }
      }
      const out = new Uint8Array(MW * MH);
      for (let i = 0; i < out.length; i++) out[i] = Math.round(a[i] * 255);
      this._fine = { data: out, width: MW, height: MH, format: 'luminance' };
      return this._fine;
    }
  }

  let loading = null;
  function load() {
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement('canvas');
        cv.width = MW; cv.height = MH;
        const ctx = cv.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, MW, MH).data, mask = new Uint8Array(MW * MH);
        for (let i = 0; i < mask.length; i++) mask[i] = d[i * 4] > 127 ? 1 : 0;
        resolve(new Planet(mask));
      };
      img.onerror = () => reject(new Error('The land map could not be read.'));
      img.src = LAND_PNG;
    });
    return loading;
  }

  root.Planet = { load, RIDGES, HOTSPOTS, VENTS, unwrap };
})(typeof self !== 'undefined' ? self : this);
