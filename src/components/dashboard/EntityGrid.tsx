// @author  veera
// @file    components/dashboard/EntityGrid.tsx

import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ChevronLeftOutlined from '@mui/icons-material/ChevronLeftOutlined'
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined'
import { IconButton } from '@mui/material'
import type { Swiper as SwiperType } from 'swiper'
import { Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EntitySliderCard } from '@/components/dashboard/EntitySliderCard'
import { EmptyState } from '@/components/ui/EmptyState'
import type { EntityListItem } from '@/types/models'
import { useUiStore } from '@/store/useUiStore'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

export default function EntityGrid({
  entities,
  basePath,
}: {
  entities: EntityListItem[]
  basePath: string
}) {
  const navigate = useNavigate()
  const setSelCo = useUiStore((s) => s.setSelCo)
  const swiperRef = useRef<SwiperType | null>(null)

  const openEntity = (id: string) => {
    setSelCo(id)
    navigate(`${basePath}/flux-review/${id}`)
  }

  if (entities.length === 0) {
    return (
      <EmptyState
        title="No entities match your filters"
        description="Try changing region or tag filters above."
      />
    )
  }

  return (
    <div className="dashboard-entity-slider">
      <div className="dashboard-entity-slider__track">
        <IconButton
          className="dashboard-entity-slider__nav dashboard-entity-slider__nav--prev"
          aria-label="Previous entities"
          onClick={() => swiperRef.current?.slidePrev()}
          size="small"
        >
          <ChevronLeftOutlined />
        </IconButton>

        <Swiper
          className="dashboard-entity-slider__swiper"
          modules={[Navigation, Pagination]}
          spaceBetween={16}
          slidesPerView={1.15}
          breakpoints={{
            640: { slidesPerView: 2.1 },
            960: { slidesPerView: 3.1 },
            1280: { slidesPerView: 4 },
          }}
          pagination={{
            clickable: true,
            el: '.dashboard-entity-slider__pagination',
            bulletClass: 'dashboard-entity-slider__bullet',
            bulletActiveClass: 'dashboard-entity-slider__bullet--active',
          }}
          onSwiper={(swiper) => {
            swiperRef.current = swiper
          }}
        >
          {entities.map((entity) => (
            <SwiperSlide key={entity.id} className="dashboard-entity-slider__slide">
              <EntitySliderCard
                entity={entity}
                onOpen={() => openEntity(entity.id)}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        <IconButton
          className="dashboard-entity-slider__nav dashboard-entity-slider__nav--next"
          aria-label="Next entities"
          onClick={() => swiperRef.current?.slideNext()}
          size="small"
        >
          <ChevronRightOutlined />
        </IconButton>
      </div>

      <div className="dashboard-entity-slider__pagination" />
    </div>
  )
}
